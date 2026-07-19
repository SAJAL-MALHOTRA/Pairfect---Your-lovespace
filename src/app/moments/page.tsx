"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, Plus, Camera, Loader2, AlertCircle, Trash2, X, Image as ImageIcon, Lock } from "lucide-react";

// Image optimization utility: Convert to WebP, resize max side to 1200px, compress to ~200-250KB
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIDE = 1200;

        if (width > height) {
          if (width > MAX_SIDE) {
            height = Math.round((height * MAX_SIDE) / width);
            width = MAX_SIDE;
          }
        } else {
          if (height > MAX_SIDE) {
            width = Math.round((width * MAX_SIDE) / height);
            height = MAX_SIDE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Quality 0.8 is standard for high quality and optimized size (~200KB)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob output is empty"));
            }
          },
          "image/webp",
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function MomentsPage() {
  const { user, pair, profile, partner, loading } = useAuth();
  const [moments, setMoments] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isEligible, setIsEligible] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [momentDate, setMomentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMomentsAndUrls = async () => {
    if (!pair) return;
    try {
      // 1. Check eligibility: first 50 unique couples to active the feature (claim a slot by having at least 1 moment)
      const { data: allActiveMoments, error: claimErr } = await supabase
        .from("shared_moments")
        .select("pair_id");

      if (!claimErr && allActiveMoments) {
        const activePairs = Array.from(new Set(allActiveMoments.map((m: any) => m.pair_id)));
        const totalClaimedCouples = activePairs.length;
        const currentCoupleHasClaimed = activePairs.includes(pair.id);

        // Eligible if current couple already has moments, or if there is room for new couples (less than 50 claimed)
        setIsEligible(currentCoupleHasClaimed || totalClaimedCouples < 50);
      }
      setCheckingEligibility(false);

      // 2. Fetch moments
      const { data: momentsData, error: momentsErr } = await supabase
        .from("shared_moments")
        .select("*")
        .eq("pair_id", pair.id)
        .order("moment_date", { ascending: false });

      if (momentsErr) throw momentsErr;

      // 3. Resolve signed URLs for private images
      const resolvedMoments = await Promise.all(
        (momentsData || []).map(async (moment: any) => {
          if (moment.photo_url) {
            try {
              const { data: urlData, error: urlErr } = await supabase.storage
                .from("memories")
                .createSignedUrl(moment.photo_url, 3600); // 1hr token

              if (urlErr) throw urlErr;
              return { ...moment, resolved_photo_url: urlData.signedUrl };
            } catch (err) {
              console.error("Error creating signed URL for moment:", moment.id, err);
              return { ...moment, resolved_photo_url: null };
            }
          }
          return moment;
        })
      );

      setMoments(resolvedMoments);
    } catch (err) {
      console.error("Error loading memories:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair && profile) {
      fetchMomentsAndUrls();
    }
  }, [pair, loading, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) return;
    if (!title.trim()) {
      setError("Please add a title for your memory.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let storagePath: string | null = null;

      // 1. Upload photo if provided (optimized to WebP, max 1200px side)
      if (photoFile) {
        console.log("[MomentsPage] Compressing selected file:", photoFile.name, "size:", photoFile.size);
        let compressedBlob: Blob = photoFile;
        try {
          compressedBlob = await compressImage(photoFile);
          console.log("[MomentsPage] Image compressed successfully to WebP! Size:", compressedBlob.size);
        } catch (compressErr) {
          console.warn("[MomentsPage] Image compression failed, falling back to original upload:", compressErr);
        }

        const filename = `${Date.now()}.webp`;
        storagePath = `${pair.id}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("memories")
          .upload(storagePath, compressedBlob, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/webp",
          });

        if (uploadError) throw uploadError;
      }

      // 2. Save moment details to DB
      const { error: insertError } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          created_by: user!.id,
          title: title.trim(),
          description: description.trim() || null,
          photo_url: storagePath,
          moment_date: momentDate,
        });

      if (insertError) throw insertError;

      // Reset form states
      setTitle("");
      setDescription("");
      setMomentDate(format(new Date(), "yyyy-MM-dd"));
      setPhotoFile(null);
      setPhotoPreview(null);
      setModalOpen(false);

      // Reload scrapbook timeline
      await fetchMomentsAndUrls();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMoment = async (id: string, photoUrl: string | null) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    try {
      // 1. Delete details from DB
      const { error: dbError } = await supabase
        .from("shared_moments")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // 2. Delete file from Storage if exists
      if (photoUrl) {
        await supabase.storage.from("memories").remove([photoUrl]);
      }

      setMoments((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete moment.");
    }
  };

  if (loading || fetching || checkingEligibility) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
        <Navigation />
        <main className="max-w-md w-full mx-auto px-4 py-24 flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-fade-in">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/40 border border-border text-primary shadow-inner">
            <Lock className="w-10 h-10 text-pink-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-sans font-black tracking-tight text-foreground">🎉 Early Access is Full!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Moments was available exclusively to our first 50 couples. It will return soon as part of Pairfect Premium.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8 animate-fade-in">
        
        {moments.length >= 25 && (
          <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 dark:bg-pink-500/10 text-foreground text-sm flex items-start space-x-2.5 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-pink-500" />
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-pink-500" />
            <div className="space-y-1">
              <p className="font-sans font-bold text-xs uppercase tracking-wider font-mono text-pink-500">Scrapbook Limit Reached</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You've reached your 25-memory limit. Unlimited memories will be available with Pairfect Premium.
              </p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
              <BookOpen className="w-7 h-7 text-primary" />
              <span>Shared Scrapbook</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Document your milestones, dates, and sweet memories.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${moments.length >= 25 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                {moments.length} / 25 Memories Used
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Early Access
              </span>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={moments.length >= 25}
            className="inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-pink-500/10 dark:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Moment</span>
          </button>
        </div>

        {/* Moments Scrapbook Feed */}
        {moments.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-16 text-center text-muted-foreground">
            <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground/45" />
            <p className="text-sm font-bold font-sans">Your scrapbook is empty</p>
            <p className="text-xs text-gray-400 mt-1">
              Save your first relationship photo or note milestone by clicking Add Moment.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-border ml-4 sm:ml-6 space-y-8 py-4">
            {moments.map((moment) => {
              const isCreator = moment.created_by === user!.id;
              const creatorName = isCreator 
                ? profile?.display_name 
                : (partner?.display_name || "Partner");

              return (
                <div key={moment.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-pink-500 ring-4 ring-background border border-border" />
                  
                  <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 max-w-2xl space-y-4 hover:border-gray-300 dark:hover:border-white/20 transition-all group">
                    {/* 3px top gradient accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-sans font-black text-base text-foreground tracking-tight">
                          {moment.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(parseISO(moment.moment_date), "MMMM d, yyyy")}</span>
                          <span>•</span>
                          <span>Saved by {creatorName}</span>
                        </div>
                      </div>

                      {isCreator && (
                        <button
                          onClick={() => handleDeleteMoment(moment.id, moment.photo_url)}
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-muted cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {moment.description && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {moment.description}
                      </p>
                    )}

                    {moment.resolved_photo_url && (
                      <div className="rounded-md overflow-hidden max-h-[350px] border border-border">
                        <img
                          src={moment.resolved_photo_url}
                          alt={moment.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-lg border border-border bg-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* 3px top gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa] z-10" />

              <button
                onClick={() => {
                  setModalOpen(false);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-sans font-black text-foreground tracking-tight mb-5">
                Add to Scrapbook
              </h2>

              {error && (
                <div className="mb-4 p-3.5 rounded-md bg-accent/40 border border-border text-primary text-xs flex items-center space-x-1.5 animate-fade-in">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddMoment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Picnic, Dinner Date..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this moment (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full h-20 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Date of Moment
                  </label>
                  <input
                    type="date"
                    required
                    value={momentDate}
                    onChange={(e) => setMomentDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Upload Photo
                  </label>
                  {photoPreview ? (
                    <div className="relative rounded-md overflow-hidden border border-border max-h-[180px]">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer bg-muted/40 hover:bg-muted transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 text-muted-foreground/50 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Click to select an image file
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground border border-border hover:bg-muted bg-card rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 rounded-md flex items-center space-x-1.5 cursor-pointer shadow-md shadow-pink-500/10 dark:shadow-none"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Memory</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
