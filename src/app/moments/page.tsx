"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, Plus, Camera, Loader2, AlertCircle, Trash2, X, Lock } from "lucide-react";

// Image optimization utility
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
      // 1. Check eligibility: first 50 unique couples to active the feature
      const { data: allActiveMoments, error: claimErr } = await supabase
        .from("shared_moments")
        .select("pair_id");

      if (!claimErr && allActiveMoments) {
        const activePairs = Array.from(new Set(allActiveMoments.map((m: any) => m.pair_id)));
        const totalClaimedCouples = activePairs.length;
        const currentCoupleHasClaimed = activePairs.includes(pair.id);
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
                .createSignedUrl(moment.photo_url, 3600);

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

      if (photoFile) {
        let compressedBlob: Blob = photoFile;
        try {
          compressedBlob = await compressImage(photoFile);
        } catch (compressErr) {
          console.warn("Image compression failed, using original file:", compressErr);
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

      setTitle("");
      setDescription("");
      setMomentDate(format(new Date(), "yyyy-MM-dd"));
      setPhotoFile(null);
      setPhotoPreview(null);
      setModalOpen(false);

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
      const { error: dbError } = await supabase
        .from("shared_moments")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

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
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713] pb-24 md:pb-8">
        <Navigation />
        <main className="max-w-md w-full mx-auto px-6 py-24 flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-fade-in">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-2xl bg-[#FAF6EE] dark:bg-[#28221D] border border-[#EAE3D5] dark:border-[#3E352E] shadow-sm">
            <Lock className="w-8 h-8 text-[#802030]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5]">Early Access is Full!</h1>
            <p className="text-sm text-[#7C7267] leading-relaxed">
              Moments was available exclusively to our first 50 couples. It will return soon as part of Pairfect Premium.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-start space-y-12 animate-fade-in select-none">
        
        {moments.length >= 25 && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-[#802030] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-mono font-bold uppercase">Scrapbook Limit Reached</p>
              <p className="text-[#7C7267]">
                You've reached your 25-memory limit. Unlimited memories will be available with Premium.
              </p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
              Scrapbook
            </span>
            <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mt-1">
              Our Memories
            </h1>
            <p className="text-xs text-[#7C7267] mt-1">
              Document your milestones, dates, and sweet moments.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={moments.length >= 25}
            className="btn-primary py-2.5 px-6 text-xs uppercase font-bold tracking-wider cursor-pointer disabled:opacity-40"
          >
            Add Moment
          </button>
        </div>

        {/* Polaroid Scrapbook Album Grid */}
        {moments.length === 0 ? (
          <div className="text-center py-24 bg-[#FAF6EE] dark:bg-[#28221D] rounded-2xl border border-dashed border-[#EAE3D5] dark:border-[#3E352E] text-sm text-[#7C7267] italic">
            Your shared photo scrapbook is empty. Add a moment to start your album.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-14 pt-4">
            {moments.map((moment, idx) => {
              const isCreator = moment.created_by === user!.id;
              // Add slight organic rotation to each polaroid card to look like a physical scrapbook layout
              const rotationDegs = [1.5, -2, 2, -1.5, 1][idx % 5];
              
              return (
                <div
                  key={moment.id}
                  style={{ transform: `rotate(${rotationDegs}deg)` }}
                  className="bg-[#FAF6EE] dark:bg-[#201A15] p-5 pb-8 border border-[#EAE3D5] dark:border-amber-950/20 shadow-md hover:shadow-lg hover:rotate-0 hover:scale-102 transition-all duration-300 w-full max-w-[280px] mx-auto flex flex-col justify-between relative group"
                >
                  {/* Polaroid Image Area */}
                  <div className="aspect-square bg-stone-100 dark:bg-stone-900 border border-stone-200/40 relative overflow-hidden flex items-center justify-center">
                    {moment.resolved_photo_url ? (
                      <img
                        src={moment.resolved_photo_url}
                        alt={moment.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-10 h-10 text-stone-300" />
                    )}

                    {isCreator && (
                      <button
                        onClick={() => handleDeleteMoment(moment.id, moment.photo_url)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Cursive Handwriting text below image */}
                  <div className="pt-5 text-center space-y-1">
                    <p className="font-handwriting text-lg font-bold text-[#2E2A25] dark:text-[#E8E2D5] leading-tight break-words px-1">
                      {moment.title}
                    </p>
                    <p className="font-handwriting text-xs text-[#8A7B6E] tracking-wide">
                      {format(parseISO(moment.moment_date), "MMMM d, yyyy")}
                    </p>
                    {moment.description && (
                      <p className="text-[10px] text-[#7C7267] font-sans truncate px-1 mt-1">
                        {moment.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Moment Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-3xl border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FCFBF9] dark:bg-[#1C1713] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              
              <button
                onClick={() => {
                  setModalOpen(false);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-4 right-4 p-1.5 text-[#8A7B6E] hover:text-[#2E2A25] rounded-lg hover:bg-[#FAF6EE] transition-all cursor-pointer z-10"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h2 className="text-2xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mb-5">
                Add to Scrapbook
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddMoment} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#8A7B6E] mb-1">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Picnic, Dinner Date..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#8A7B6E] mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this moment (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full h-20 px-3 py-2 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-sm resize-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#8A7B6E] mb-1">
                    Date of Moment
                  </label>
                  <input
                    type="date"
                    required
                    value={momentDate}
                    onChange={(e) => setMomentDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#8A7B6E] mb-1">
                    Photo Memory
                  </label>
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#EAE3D5] dark:border-[#3E352E] max-h-[180px]">
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
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#EAE3D5] dark:border-[#3E352E] rounded-xl cursor-pointer bg-[#FAF6EE] dark:bg-[#28221D] hover:bg-[#FAF6EE]/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                          <Camera className="w-7 h-7 text-[#8A7B6E]/50 mb-1" />
                          <p className="text-xs text-[#8A7B6E]">
                            Upload photo
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

                <div className="pt-4 border-t border-[#EAE3D5] dark:border-[#3E352E] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    className="btn-secondary py-2 px-4 text-xs uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2 px-5 text-xs uppercase font-bold tracking-wider cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1 inline" />}
                    <span>Save Moment</span>
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
