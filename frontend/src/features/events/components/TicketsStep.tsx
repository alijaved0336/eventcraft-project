import React from 'react';
import DatePicker from '@/components/ui/date-picker';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description?: string;
}

interface TicketsStepProps {
  tiers: TicketTier[];
  onAddTier: (tier: TicketTier) => void;
  onUpdateTier: (tier: TicketTier) => void;
  onRemoveTier: (id: string) => void;
  isFree: boolean;
  onFreeToggle: (free: boolean) => void;
  registrationDeadline: string;
  onRegistrationDeadlineChange: (date: string) => void;
}

const TicketsStep: React.FC<TicketsStepProps> = ({
  tiers,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
  isFree,
  onFreeToggle,
  registrationDeadline,
  onRegistrationDeadlineChange,
}) => {
  const [editingField, setEditingField] = React.useState<{
    id: string;
    field: 'name' | 'price' | 'capacity';
  } | null>(null);

  const handleUpdate = (id: string, field: string, value: string | number) => {
    const tier = tiers.find((t) => t.id === id);
    if (tier) {
      const updatedValue = field === 'name' ? value : Number(value);
      onUpdateTier({ ...tier, [field]: updatedValue });
    }
    setEditingField(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Ticket Configuration
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Define how guests will access your experience. Multiple tiers allow for tailored entry
          options.
        </p>

        <div className="space-y-4">
          {/* Ticket Tiers List */}
          <div className="bg-muted/30 rounded-xl p-1 space-y-1 border border-border">
            <div className="grid grid-cols-12 px-4 py-2 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6">Tier Name</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-3 text-right">Capacity</div>
            </div>

            {tiers.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm italic">
                No tiers created yet. Start shaping your guest access.
              </div>
            ) : (
              tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="grid grid-cols-12 items-center px-4 py-4 bg-card rounded-lg group hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      confirmation_number
                    </span>
                    <div className="flex-1">
                      {editingField?.id === tier.id && editingField.field === 'name' ? (
                        <input
                          autoFocus
                          type="text"
                          defaultValue={tier.name}
                          onBlur={(e) => handleUpdate(tier.id, 'name', e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            handleUpdate(tier.id, 'name', e.currentTarget.value)
                          }
                          className="w-full bg-muted border-none rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                      ) : (
                        <p
                          onClick={() => setEditingField({ id: tier.id, field: 'name' })}
                          className="text-sm font-semibold text-foreground cursor-text hover:text-primary transition-colors"
                        >
                          {tier.name}
                        </p>
                      )}
                      {tier.description && (
                        <p className="text-[0.6875rem] text-muted-foreground">{tier.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-sm font-bold text-primary">
                    {isFree ? (
                      'Free'
                    ) : editingField?.id === tier.id && editingField.field === 'price' ? (
                      <div className="flex items-center justify-end">
                        <span className="mr-1 text-foreground">$</span>
                        <input
                          autoFocus
                          type="number"
                          step="0.01"
                          defaultValue={tier.price}
                          onBlur={(e) => handleUpdate(tier.id, 'price', e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            handleUpdate(tier.id, 'price', e.currentTarget.value)
                          }
                          className="w-20 bg-muted border-none rounded px-1 py-1 text-sm font-bold text-right outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                    ) : (
                      <span
                        onClick={() => setEditingField({ id: tier.id, field: 'price' })}
                        className="cursor-text hover:opacity-80 transition-opacity"
                      >
                        ${tier.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-3">
                    {editingField?.id === tier.id && editingField.field === 'capacity' ? (
                      <input
                        autoFocus
                        type="number"
                        defaultValue={tier.capacity}
                        onBlur={(e) => handleUpdate(tier.id, 'capacity', e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          handleUpdate(tier.id, 'capacity', e.currentTarget.value)
                        }
                        className="w-16 bg-muted border-none rounded px-1 py-1 text-sm font-medium text-right outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    ) : (
                      <span
                        onClick={() => setEditingField({ id: tier.id, field: 'capacity' })}
                        className="text-sm text-foreground font-medium cursor-text hover:text-primary transition-colors"
                      >
                        {tier.capacity}
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveTier(tier.id)}
                      className="material-symbols-outlined text-muted-foreground hover:text-destructive transition-colors text-lg"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Ticket Tier Button */}
          <button
            onClick={() =>
              onAddTier({
                id: Math.random().toString(36).substr(2, 9),
                name: 'New Tier',
                price: 0,
                capacity: 100,
              })
            }
            className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5 hover:border-primary transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add ticket tier
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
        {/* Free Ticket Toggle */}
        <div className="bg-muted/30 p-6 rounded-xl flex items-center justify-between border border-border">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Free Event</h3>
            <p className="text-[0.6875rem] text-muted-foreground">
              No payment collection required for any ticket tiers.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isFree}
              onChange={(e) => onFreeToggle(e.target.checked)}
            />
            <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Registration Deadline
          </label>
          <DatePicker
            date={registrationDeadline}
            onChange={onRegistrationDeadlineChange}
            placeholder="Select deadline"
          />
        </div>
      </section>
    </div>
  );
};

export default TicketsStep;
