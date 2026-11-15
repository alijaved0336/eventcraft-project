import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateEvent, fetchEvents } from '@/features/events/store/eventsSlice';
import { EventType, EventStatus } from '@/features/events/types';
import LoadingOverlay from '@/components/ui/loading-overlay';
import { useAuthStore } from '@/store/authStore';

type LocalEventType = 'In-Person' | 'Virtual' | 'Hybrid';

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);
  const { user } = useAuthStore();
  const event = events.find((e) => e.id === id);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LocalEventType>('In-Person');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  useEffect(() => {
    if (event && !eventsLoading) {
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      if (!event.isOwner && !isAdmin) {
        toast.error('You do not have permission to edit this event');
        navigate('/dashboard/events');
      }
    }
  }, [event, eventsLoading, navigate, user?.role]);

  useEffect(() => {
    if (event && !isLoaded) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setType(
        event.type === EventType.IN_PERSON
          ? 'In-Person'
          : event.type === EventType.VIRTUAL
            ? 'Virtual'
            : 'Hybrid',
      );
      setLocation(event.location?.address || '');
      setIsPublic(event.visibility === 'public');
      setCategories(event.tags || []);
      setBannerPreview(event.bannerImage || null);
      setBannerPreview(event.bannerImage || null);
      setIsLoaded(true);
    }
  }, [event, isLoaded]);

  useEffect(() => {
    if (event && editorRef.current && editorRef.current.innerHTML !== (event.description || '')) {
      editorRef.current.innerHTML = event.description || '';
    }
  }, [event]);

  // Sync state if it's empty (placeholder effect)
  const isEditorEmpty =
    !description ||
    description === '<p><br></p>' ||
    description === '<div><br></div>' ||
    description === '';

  // Banner Handlers
  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Image uploaded successfully');
    }
  };

  const removeBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Banner removed');
  };

  // Category Handlers
  const removeCategory = (catToRemove: string) => {
    setCategories(categories.filter((cat) => cat !== catToRemove));
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCatInput('');
      setIsModalOpen(false);
      toast.success(`Category "${trimmed}" added`);
    } else if (trimmed && categories.includes(trimmed)) {
      toast.error('Category already exists');
    }
  };

  // Description Editor Formatting (WYSIWYG)
  const handleFormat = (command: string, value: string = '') => {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setDescription(e.currentTarget.innerHTML);
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
      setIsLinkModalOpen(true);
      setLinkInput('');
    } else {
      toast.error('Please select some text first to add a link');
    }
  };

  const applyLink = () => {
    if (savedSelection.current && linkInput.trim()) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }

      const url = linkInput.startsWith('http') ? linkInput : `https://${linkInput}`;
      handleFormat('createLink', url);

      setIsLinkModalOpen(false);
      setLinkInput('');
      savedSelection.current = null;
      toast.success('Link added successfully');
    } else if (!linkInput.trim()) {
      toast.error('Please enter a valid URL');
    }
  };

  // Form Actions
  const handleSaveDraft = () => {
    toast.info('Changes saved as draft', {
      description: `"${title || 'Untitled Event'}" has been updated.`,
    });
  };

  const handleSave = async () => {
    if (!title) {
      toast.error('Please enter an event title');
      return;
    }

    if (!id) return;

    setIsSaving(true);
    try {
      const eventData = {
        title,
        description: description || undefined,
        type:
          type === 'In-Person'
            ? EventType.IN_PERSON
            : type === 'Virtual'
              ? EventType.VIRTUAL
              : EventType.HYBRID,
        visibility: isPublic ? 'public' : 'private',
        bannerImage: bannerPreview || undefined,
        tags: categories,
        location: {
          address: location || undefined,
        },
      };

      await dispatch(updateEvent({ id, data: eventData })).unwrap();
      toast.success('Event updated successfully!');
      navigate('/dashboard/events');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusTransition = async (newStatus: EventStatus) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await dispatch(updateEvent({ id, data: { status: newStatus } })).unwrap();
      toast.success(`Event status updated to ${newStatus}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  if (eventsLoading && !event) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event && !eventsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center px-4">
        <span className="material-symbols-outlined text-6xl text-muted-foreground/30 mb-4">
          event_busy
        </span>
        <h2 className="text-2xl font-bold text-foreground">Event Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          We couldn't find the event you're looking for.
        </p>
        <Link
          to="/dashboard/events"
          className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background font-display text-foreground">
      <LoadingOverlay isVisible={isSaving} message="Updating your event..." />
      {/* Category Modal - Same as CreateEventPage */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border scale-in-center">
            <h3 className="text-xl font-bold mb-4 text-foreground">Add New Category</h3>
            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Enter category name..."
                className="w-full rounded-lg border-border bg-muted px-4 py-3 text-foreground focus:ring-primary focus:border-primary outline-none"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-muted py-3 font-semibold text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border scale-in-center">
            <h3 className="text-xl font-bold mb-4 text-foreground">Add Link</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  URL
                </p>
                <input
                  autoFocus
                  type="text"
                  placeholder="https://example.com"
                  className="w-full rounded-lg border-border bg-muted px-4 py-3 text-foreground focus:ring-primary focus:border-primary outline-none"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    savedSelection.current = null;
                  }}
                  className="flex-1 rounded-xl bg-muted py-3 font-semibold text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyLink}
                  className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Form (60%) */}
        <section className="w-full lg:w-3/5 border-r border-border bg-background p-6 lg:p-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Events</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-foreground text-sm font-bold uppercase tracking-tighter">
                    Edit Event
                  </span>
                </div>
                <Link
                  to="/dashboard/events"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Events
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Event</h1>
              <p className="text-muted-foreground mt-1">Step {currentStep} of 4: Update Details</p>
            </div>

            {/* Stepper */}
            <div className="flex border-b border-border gap-8 mb-8">
              {['Details', 'Tickets', 'Settings', 'Publish'].map((step, idx) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(idx + 1)}
                  className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-2 transition-colors ${
                    currentStep === idx + 1
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <p className="text-sm font-bold">{step}</p>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="space-y-8 pb-32">
              {currentStep === 1 && (
                <>
                  {/* Title */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Event Title</label>
                    <input
                      className="w-full rounded-xl border-border bg-muted/30 px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="e.g. Design Systems Conference 2024"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Type Selector */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Event Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['In-Person', 'Virtual', 'Hybrid'] as LocalEventType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            type === t
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-border/80'
                          }`}
                        >
                          <span className="material-symbols-outlined">
                            {t === 'In-Person' ? 'groups' : t === 'Virtual' ? 'videocam' : 'bolt'}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rich Text Editor (WYSIWYG) */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Event Description</label>
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                      <div className="flex items-center gap-2 bg-muted/30 p-2 border-b border-border">
                        <button
                          onClick={() => handleFormat('bold')}
                          className="p-1 hover:bg-muted rounded text-foreground material-symbols-outlined text-lg"
                        >
                          format_bold
                        </button>
                        <button
                          onClick={() => handleFormat('italic')}
                          className="p-1 hover:bg-muted rounded text-foreground material-symbols-outlined text-lg"
                        >
                          format_italic
                        </button>
                        <button
                          onClick={() => handleFormat('insertUnorderedList')}
                          className="p-1 hover:bg-muted rounded text-foreground material-symbols-outlined text-lg"
                        >
                          format_list_bulleted
                        </button>
                        <div className="w-px h-4 bg-border mx-1"></div>
                        <button
                          onClick={handleLinkClick}
                          className="p-1 hover:bg-muted rounded text-foreground material-symbols-outlined text-lg"
                        >
                          link
                        </button>
                      </div>
                      <div className="relative">
                        {isEditorEmpty && (
                          <div className="absolute inset-0 p-4 pointer-events-none text-muted-foreground/50 text-sm">
                            Tell your attendees what to expect... Explain the agenda, speakers, and
                            why they should join.
                          </div>
                        )}
                        <div
                          ref={editorRef}
                          contentEditable
                          onInput={handleEditorInput}
                          className="w-full min-h-48 focus:ring-0 p-4 text-foreground bg-transparent outline-none prose dark:prose-invert max-w-none"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Image Drop Zone */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Event Banner</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 transition-all hover:border-primary hover:bg-primary/5 overflow-hidden"
                    >
                      {bannerPreview ? (
                        <>
                          <img
                            src={bannerPreview}
                            alt="Banner Preview"
                            className="h-full w-full object-cover max-h-64"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={removeBanner}
                              className="flex items-center justify-center size-8 rounded-full bg-background/90 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-md"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-6">
                          <span className="material-symbols-outlined text-4xl text-muted-foreground group-hover:text-primary">
                            upload_file
                          </span>
                          <p className="text-sm font-medium text-foreground">
                            Click or drag and drop image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recommended: 16:9 ratio, min. 1200x675px
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerChange}
                      />
                    </div>
                  </div>

                  {/* Category Tags */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground border border-border"
                        >
                          {cat}{' '}
                          <button
                            onClick={() => removeCategory(cat)}
                            className="material-symbols-outlined text-xs hover:text-destructive transition-colors"
                          >
                            close
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">add</span> Add Category
                      </button>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Location</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                        location_on
                      </span>
                      <input
                        className="w-full rounded-xl border-border bg-muted/30 pl-10 pr-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Search for a venue or address"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                    <div>
                      <p className="text-sm font-bold text-foreground">Public Event</p>
                      <p className="text-xs text-muted-foreground">
                        Discoverable by everyone on EventCraft
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative h-6 w-11 rounded-full transition-colors p-1 ${isPublic ? 'bg-primary' : 'bg-muted border border-border'}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full transition-transform ${isPublic ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-muted-foreground'}`}
                      ></div>
                    </button>
                  </div>
                </>
              )}

              {currentStep === 4 && event && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-6 rounded-2xl border border-border bg-muted/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${
                          event.status === 'scheduled'
                            ? 'bg-indigo-500'
                            : event.status === 'published'
                              ? 'bg-blue-500'
                              : event.status === 'draft'
                                ? 'bg-muted-foreground'
                                : event.status === 'cancelled'
                                  ? 'bg-destructive'
                                  : 'bg-green-500'
                        }`}
                      >
                        Current Status: {event.status}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 text-foreground">
                      Available Transitions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Transitions from Draft */}
                      {event.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition('published')}
                            className="flex items-center justify-between p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all group"
                          >
                            <div className="text-left">
                              <p className="font-bold text-blue-600 dark:text-blue-400">
                                Publish Now
                              </p>
                              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                                Make event public and active
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-blue-500 group-hover:translate-x-1 transition-transform">
                              rocket_launch
                            </span>
                          </button>
                          <button
                            onClick={() => handleStatusTransition('scheduled')}
                            className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all group"
                          >
                            <div className="text-left">
                              <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                Schedule
                              </p>
                              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
                                Set to go live at start date
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-indigo-500 group-hover:translate-x-1 transition-transform">
                              calendar_month
                            </span>
                          </button>
                        </>
                      )}

                      {/* Transitions from Published */}
                      {event.status === 'published' && (
                        <button
                          onClick={() => handleStatusTransition('scheduled')}
                          className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all group"
                        >
                          <div className="text-left">
                            <p className="font-bold text-indigo-600 dark:text-indigo-400">
                              Move to Scheduled
                            </p>
                            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
                              Change to scheduled status
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-indigo-500 group-hover:translate-x-1 transition-transform">
                            schedule
                          </span>
                        </button>
                      )}

                      {/* Transitions from Scheduled */}
                      {event.status === 'scheduled' && (
                        <button
                          onClick={() => handleStatusTransition('published')}
                          className="flex items-center justify-between p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all group"
                        >
                          <div className="text-left">
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              Publish Live
                            </p>
                            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                              Force event to be published
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-blue-500 group-hover:translate-x-1 transition-transform">
                            publish
                          </span>
                        </button>
                      )}

                      {/* Terminal State options (Cancel/End) - Allowed for all non-terminal states */}
                      {(event.status === 'draft' ||
                        event.status === 'published' ||
                        event.status === 'scheduled') && (
                        <>
                          <button
                            onClick={() => handleStatusTransition('cancelled')}
                            className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/10 hover:bg-destructive/20 transition-all group"
                          >
                            <div className="text-left">
                              <p className="font-bold text-destructive">Cancel Event</p>
                              <p className="text-xs text-destructive/70">Stop all activities</p>
                            </div>
                            <span className="material-symbols-outlined text-destructive group-hover:translate-x-1 transition-transform">
                              cancel
                            </span>
                          </button>
                          <button
                            onClick={() => handleStatusTransition('ended')}
                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-all group"
                          >
                            <div className="text-left">
                              <p className="font-bold text-foreground">End Event</p>
                              <p className="text-xs text-muted-foreground">Mark as completed</p>
                            </div>
                            <span className="material-symbols-outlined text-muted-foreground group-hover:translate-x-1 transition-transform">
                              done_all
                            </span>
                          </button>
                        </>
                      )}

                      {/* Terminal States help text */}
                      {(event.status === 'cancelled' || event.status === 'ended') && (
                        <div className="col-span-full py-10 text-center">
                          <span className="material-symbols-outlined text-4xl text-muted-foreground/30 mb-2">
                            lock
                          </span>
                          <p className="text-muted-foreground font-medium">
                            This event is in a terminal state ({event.status}) and cannot be
                            transitioned further.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep > 1 && currentStep < 4 && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold mb-2 text-foreground">Coming Soon</h2>
                  <p className="text-muted-foreground">
                    Step {currentStep} implementation is in progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel: Preview (40%) */}
        <section className="hidden lg:flex w-2/5 flex-col items-center justify-center bg-muted/10 p-10 relative">
          <div className="absolute top-6 left-10 flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
            <span className="material-symbols-outlined text-sm">visibility</span> Live Preview
          </div>

          <div className="relative w-[280px] h-[580px] rounded-[3rem] border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden ring-4 ring-slate-900/5">
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-end">
              <div className="h-4 w-24 bg-black rounded-b-xl"></div>
            </div>
            <div className="h-full w-full bg-background overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-6">
              <div className="relative h-40 w-full bg-muted">
                <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center overflow-hidden">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="mobile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-muted-foreground/30 text-3xl">
                      image
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2 py-1 text-[8px] font-bold text-foreground">
                  1/1
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="h-4 w-fit px-1.5 bg-primary/10 rounded text-[10px] font-bold text-primary flex items-center justify-center uppercase tracking-wider">
                    {categories[0] || type}
                  </div>
                  <h3 className="text-sm font-bold leading-tight text-foreground">
                    {title || 'Event Title Preview'}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">
                      calendar_today
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Registration Open</p>
                    <p className="text-[9px] text-muted-foreground">Add to calendar</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">
                      location_on
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground">
                      {location || 'Palace of Fine Arts'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {location ? 'Primary Venue' : 'San Francisco, CA'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div
                    className="text-[10px] text-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: description || 'Tell your attendees what to expect...',
                    }}
                  ></div>
                </div>

                <div className="pt-4 sticky bottom-0 bg-background">
                  <button
                    disabled
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all opacity-90"
                  >
                    Get Tickets
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button
                disabled
                className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground/30 cursor-not-allowed transition-colors"
                title="Coming Soon"
              >
                <span className="material-symbols-outlined">smartphone</span>
              </button>
              <button
                disabled
                className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground/30 cursor-not-allowed transition-colors"
                title="Coming Soon"
              >
                <span className="material-symbols-outlined">laptop</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Last saved at{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-1 sm:flex-none items-center gap-4 justify-end">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              Save Draft
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 transition-all rounded-xl active:scale-[0.98]"
            >
              Save Changes
              <span className="material-symbols-outlined text-sm">check</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EditEventPage;
