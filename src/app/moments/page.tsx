"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, Plus, Camera, Loader2, AlertCircle, Trash2, X, Image as ImageIcon } from "lucide-react";

export default function MomentsPage() {
  const { user, pair, profile, partner, loading } = useAuth();
  const [moments, setMoments] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
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
    setFetching(true);
    try {
      // 1. Fetch moments
      const { data: momentsData, error: momentsErr } = await supabase
        .from("shared_moments")
        .select("*")
        .eq("pair_id", pair.id)
        .order("moment_date", { ascending: false });

      if (momentsErr) throw momentsErr;

      // 2. Resolve signed URLs for private images
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
    if (!loading && pair) {
      fetchMomentsAndUrls();
    }
  }, [pair, loading]);

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

      // 1. Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const filename = `${Date.now()}.${fileExt}`;
        storagePath = `${pair.id}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("memories")
          .upload(storagePath, photoFile, {
            cacheControl: "3600",
            upsert: false,
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

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-rose-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-peach-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-brand-peach-500" />
              <span>Shared scrapbook</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Document your milestones, dates, and sweet memories.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-xl border border-transparent shadow-sm text-sm font-semibold text-white bg-brand-peach-500 hover:bg-brand-peach-600 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Moment</span>
          </button>
        </div>

        {/* Moments Scrapbook Feed */}
        {moments.length === 0 ? (
          <div className="cozy-card p-16 text-center text-muted-foreground border border-dashed border-card-border bg-white/30 dark:bg-transparent">
            <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-semibold">Your scrapbook is empty</p>
            <p className="text-xs mt-1">
              Save your first relationship photo or note milestone by clicking Add Moment.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-card-border ml-4 sm:ml-6 space-y-8 py-4">
            {moments.map((moment) => {
              const isCreator = moment.created_by === user!.id;
              const creatorName = isCreator 
                ? profile?.display_name 
                : (partner?.display_name || "Partner");

              return (
                <div key={moment.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-brand-peach-400 ring-4 ring-background border border-card-border" />
                  
                  <div className="cozy-card p-5 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border max-w-2xl space-y-4 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {moment.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(parseISO(moment.moment_date), "MMMM d, yyyy")}</span>
                          <span>•</span>
                          <span>Saved by {creatorName}</span>
                        </div>
                      </div>

                      {isCreator && (
                        <button
                          onClick={() => handleDeleteMoment(moment.id, moment.photo_url)}
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl"
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
                      <div className="rounded-2xl overflow-hidden max-h-[350px] border border-card-border">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="cozy-card bg-white dark:bg-[#181615] border border-card-border w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-card-border/30 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-4">
                Add to Scrapbook
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddMoment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Picnic, Dinner Date..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-3 py-2 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this moment (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full h-20 px-3 py-2 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-foreground text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Date of Moment
                  </label>
                  <input
                    type="date"
                    required
                    value={momentDate}
                    onChange={(e) => setMomentDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Upload Photo
                  </label>
                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-card-border max-h-[180px]">
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
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-card-border rounded-2xl cursor-pointer bg-background/50 hover:bg-background transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 text-muted-foreground/60 mb-2" />
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

                <div className="pt-4 border-t border-card-border flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-card-border bg-background/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-brand-peach-500 hover:bg-brand-peach-600 rounded-xl flex items-center space-x-1.5"
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
