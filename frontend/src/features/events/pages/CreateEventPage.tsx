import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { createEvent } from '@/features/events/store/eventsSlice';
import { EventType, EventStatus } from '@/features/events/types';
import PublishStep from '../components/PublishStep';
import ScheduleStep from '../components/ScheduleStep';
import TicketsStep, { TicketTier } from '../components/TicketsStep';
import LoadingOverlay from '@/components/ui/loading-overlay';

type LocalEventType = 'In-Person' | 'Virtual' | 'Hybrid';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LocalEventType>('In-Person');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<EventStatus>('draft');
  const [pubType, setPubType] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Step 2: Schedule State
  const [eventStartDate, setEventStartDate] = useState(
    new Date().toISOString().split('T')[0] || '',
  );
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndDate, setEventEndDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [eventEndTime, setEventEndTime] = useState('18:00');
  const [timezone, setTimezone] = useState('Pacific/Los_Angeles');
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Step 3: Tickets State
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    {
      id: '1',
      name: 'Early Bird Access',
      price: 49,
      capacity: 150,
      description: 'Available until Oct 15',
    },
    {
      id: '2',
      name: 'VIP Backstage',
      price: 199,
      capacity: 25,
      description: 'Includes lounge access',
    },
  ]);
  const [isFree, setIsFree] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] = useState('2024-11-20');

  useEffect(() => {
    if (bannerPreviews.length <= 1) {
      setActivePreviewIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActivePreviewIndex((prev) => (prev + 1) % bannerPreviews.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [bannerPreviews.length]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  // Sync state if it's empty (placeholder effect)
  const isEditorEmpty =
    !description ||
    description === '<p><br></p>' ||
    description === '<div><br></div>' ||
    description === '';

  // Banner Handlers
  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPreviews: string[] = [];
      let loadedCount = 0;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === files.length) {
            setBannerPreviews((prev) => [...prev, ...newPreviews]);
            toast.success(`${files.length} image(s) uploaded successfully`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeBanner = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBanners = bannerPreviews.filter((_, i) => i !== index);
    setBannerPreviews(newBanners);
    if (activePreviewIndex >= newBanners.length) {
      setActivePreviewIndex(Math.max(0, newBanners.length - 1));
    }
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

  const dispatch = useAppDispatch();

  // Form Actions
  const handleSaveDraft = () => {
    toast.info('Draft saved successfully', {
      description: `"${title || 'Untitled Event'}" has been saved.`,
    });
  };

  const handleCreateEvent = async () => {
    if (!title) {
      toast.error('Please enter an event title');
      return;
    }

    setIsCreating(true);
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
        status,
        visibility: isPublic ? 'public' : 'private',
        bannerImage: bannerPreviews[0] || undefined,
        gallery: bannerPreviews.length > 1 ? bannerPreviews : undefined,
        tags: categories,
        location: {
          address: location || undefined,
        },
        startDate: `${eventStartDate}T${eventStartTime}`,
        endDate: `${eventEndDate}T${eventEndTime}`,
        timezone,
        isFree,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : undefined,
        ticketTiers: ticketTiers.map(({ id: _id, ...rest }) => rest),
      };

      await dispatch(createEvent(eventData)).unwrap();
      toast.success('Event created successfully!', {
        description:
          status === 'scheduled'
            ? `Event scheduled for ${scheduleDate}`
            : 'Your event has been saved.',
      });
      navigate('/dashboard/events');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDateRange = () => {
    const start = new Date(eventStartDate);
    const end = new Date(eventEndDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

    if (isNaN(start.getTime())) return 'Date TBD';

    if (eventStartDate === eventEndDate || !eventEndDate) {
      return start.toLocaleDateString('en-US', options);
    }

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  const formatPriceRange = () => {
    if (isFree) return 'Free Event';
    if (ticketTiers.length === 0) return 'Tickets available';
    const prices = ticketTiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `$${min.toFixed(2)}`;
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  const handleContinue = async () => {
    if (currentStep < 5) {
      if (currentStep === 1 && !title) {
        toast.error('Please enter an event title');
        return;
      }
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCreateEvent();
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background font-display text-foreground">
      <LoadingOverlay isVisible={isCreating} message="Creating your event..." />
      {/* Category Modal */}
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
                  <span className="text-foreground font-medium">New Event</span>
                </div>
                <Link
                  to="/dashboard/events"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Events
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create New Event
              </h1>
              <p className="text-muted-foreground mt-1">
                Step {currentStep} of 5:{' '}
                {currentStep === 1
                  ? 'Basic Details'
                  : currentStep === 2
                    ? 'Schedule'
                    : currentStep === 3
                      ? 'Tickets'
                      : currentStep === 4
                        ? 'Settings'
                        : 'Publish'}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex border-b border-border gap-8 mb-8">
              {['Details', 'Schedule', 'Tickets', 'Settings', 'Publish'].map((step, idx) => (
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
            <div className="pb-32">
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Event Banners</label>

                    {bannerPreviews.length === 0 ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 transition-all hover:border-primary hover:bg-primary/5 overflow-hidden"
                      >
                        <div className="flex flex-col items-center gap-2 p-6 text-center">
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
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {bannerPreviews.map((preview, idx) => (
                          <div
                            key={idx}
                            className="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-sm"
                          >
                            <img
                              src={preview}
                              alt={`Banner ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => removeBanner(idx, e)}
                                className="size-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary text-[8px] font-bold text-primary-foreground rounded-md uppercase tracking-wider">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-2xl">add_circle</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Add More
                          </span>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleBannerChange}
                    />
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
                            className="material-symbols-outlined text-xs hover:text-destructive"
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
                </div>
              )}

              {currentStep === 2 && (
                <ScheduleStep
                  startDate={eventStartDate}
                  onStartDateChange={setEventStartDate}
                  startTime={eventStartTime}
                  onStartTimeChange={setEventStartTime}
                  endDate={eventEndDate}
                  onEndDateChange={setEventEndDate}
                  endTime={eventEndTime}
                  onEndTimeChange={setEventEndTime}
                  timezone={timezone}
                  onTimezoneChange={setTimezone}
                  addToGoogleCalendar={addToGoogleCalendar}
                  onToggleButtonChange={setAddToGoogleCalendar}
                />
              )}

              {currentStep === 3 && (
                <TicketsStep
                  tiers={ticketTiers}
                  onAddTier={(tier) => setTicketTiers([...ticketTiers, tier])}
                  onUpdateTier={(updatedTier) =>
                    setTicketTiers(
                      ticketTiers.map((t) => (t.id === updatedTier.id ? updatedTier : t)),
                    )
                  }
                  onRemoveTier={(id) => setTicketTiers(ticketTiers.filter((t) => t.id !== id))}
                  isFree={isFree}
                  onFreeToggle={setIsFree}
                  registrationDeadline={registrationDeadline}
                  onRegistrationDeadlineChange={setRegistrationDeadline}
                />
              )}

              {currentStep === 4 && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4">
                    settings
                  </span>
                  <h2 className="text-xl font-bold mb-2 text-foreground">Settings Step</h2>
                  <p className="text-muted-foreground">
                    Event settings implementation is in progress.
                  </p>
                </div>
              )}

              {currentStep === 5 && (
                <PublishStep
                  currentStatus={status}
                  onStatusChange={setStatus}
                  pubType={pubType}
                  onPubTypeChange={setPubType}
                  scheduleDate={scheduleDate}
                  onScheduleDateChange={setScheduleDate}
                  scheduleTime={scheduleTime}
                  onScheduleTimeChange={setScheduleTime}
                  onCancelEvent={() => navigate('/dashboard/events')}
                />
              )}
            </div>
          </div>
        </section>

        {/* Right Panel: Preview (40%) */}
        <section className="hidden lg:flex w-2/5 flex-col items-center justify-center bg-background-light dark:bg-slate-950/50 p-10 relative">
          <div className="absolute top-6 left-10 flex items-center gap-2 text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
            <span className="material-symbols-outlined text-sm">visibility</span> Live Preview
          </div>

          {/* Device Mockup Container */}
          <div
            className={`relative transition-all duration-500 ease-in-out ${
              previewDevice === 'mobile'
                ? 'w-[280px] h-[580px] rounded-[3rem] border-8 border-slate-800 bg-slate-800 shadow-2xl ring-4 ring-slate-900/5'
                : 'w-full max-w-[500px] h-[500px] rounded-xl border-4 border-slate-700 bg-slate-700 shadow-xl'
            } overflow-hidden`}
          >
            {previewDevice === 'mobile' && (
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-end z-10">
                <div className="h-4 w-24 bg-black rounded-b-xl"></div>
              </div>
            )}

            <div
              className={`h-full w-full bg-background overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${previewDevice === 'mobile' ? 'pt-6' : ''} scroll-smooth`}
            >
              {/* Preview Content */}
              <div
                className={`relative ${previewDevice === 'mobile' ? 'h-40' : 'h-44'} w-full bg-muted`}
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center overflow-hidden">
                  {bannerPreviews.length > 0 ? (
                    <img
                      src={bannerPreviews[activePreviewIndex]}
                      alt="preview"
                      className="h-full w-full object-cover animate-in fade-in duration-500"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-muted-foreground/30 text-3xl">
                      image
                    </span>
                  )}
                </div>
                {bannerPreviews.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {bannerPreviews.map((_, i) => (
                      <div
                        key={i}
                        className={`size-1.5 rounded-full transition-all duration-300 ${
                          i === activePreviewIndex ? 'bg-white w-3' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {bannerPreviews.length > 0 && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2 py-1 text-[8px] font-bold text-foreground z-20">
                    {activePreviewIndex + 1}/{bannerPreviews.length}
                  </div>
                )}
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
                    <p className="text-[10px] font-bold text-foreground">{formatDateRange()}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {eventStartTime} - {eventEndTime}
                    </p>
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
                    <p className="text-[9px] text-muted-foreground">{type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">
                      confirmation_number
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground">{formatPriceRange()}</p>
                    <p className="text-[9px] text-muted-foreground">
                      Deadline:{' '}
                      {new Date(registrationDeadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-0.5">
                    About This Event
                  </h4>
                  <div
                    className="text-[10px] text-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html:
                        description ||
                        'Tell your attendees what to expect... This is where your event details will appear on the mobile app once published.',
                    }}
                  ></div>
                </div>

                <div
                  className={`pt-4 ${previewDevice === 'mobile' ? 'sticky bottom-0 bg-background' : ''}`}
                >
                  <button
                    disabled
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all opacity-90"
                  >
                    Get Tickets
                  </button>
                  <p className="text-[8px] text-center text-muted-foreground mt-2 italic px-2">
                    Button is for preview purposes only
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`size-10 rounded-full border flex items-center justify-center transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-xl">smartphone</span>
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`size-10 rounded-full border flex items-center justify-center transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-xl">laptop</span>
            </button>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Auto-saved at{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-1 sm:flex-none items-center gap-4 justify-end">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              Save as Draft
            </button>
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 transition-all rounded-xl active:scale-[0.98]"
            >
              {currentStep === 5 ? 'Confirm & Publish' : 'Continue'}
              <span className="material-symbols-outlined text-sm">
                {currentStep === 5 ? 'rocket_launch' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CreateEventPage;
