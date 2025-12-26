import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { sitesApi, supabase } from '../../lib/supabase';
import { n8nApi } from '../../lib/n8n';

// Status colors
const statusConfig = {
  idea: { label: 'Idée', color: 'bg-dark-muted', icon: FileText },
  writing: { label: 'Rédaction', color: 'bg-warning', icon: Clock },
  review: { label: 'Relecture', color: 'bg-info', icon: AlertCircle },
  scheduled: { label: 'Planifié', color: 'bg-primary', icon: Calendar },
  published: { label: 'Publié', color: 'bg-success', icon: CheckCircle },
};

// Calendar header
function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, onToday }) {
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-white capitalize">{monthName}</h2>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onPrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={onToday}>
          Aujourd'hui
        </Button>
        <Button variant="secondary" size="sm" onClick={onNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Calendar day cell
function DayCell({ date, isCurrentMonth, isToday, events, onClick }) {
  const dayNumber = date.getDate();

  return (
    <div
      className={`min-h-[100px] border border-dark-border p-2 cursor-pointer hover:bg-dark-border/30 transition-colors ${
        !isCurrentMonth ? 'bg-dark-bg/50 opacity-50' : ''
      } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
      onClick={() => onClick(date)}
    >
      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-dark-muted'}`}>
        {dayNumber}
      </div>
      <div className="space-y-1">
        {events.slice(0, 3).map((event, i) => (
          <div
            key={i}
            className={`text-xs px-1.5 py-0.5 rounded truncate ${statusConfig[event.status]?.color || 'bg-dark-muted'} text-white`}
          >
            {event.title}
          </div>
        ))}
        {events.length > 3 && (
          <div className="text-xs text-dark-muted">+{events.length - 3} autres</div>
        )}
      </div>
    </div>
  );
}

// Event detail modal
function EventModal({ event, onClose, onUpdate }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <button onClick={onClose} className="text-dark-muted hover:text-white">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-dark-muted">Statut</label>
            <div className="flex gap-2 mt-1">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => onUpdate({ ...event, status: key })}
                  className={`px-2 py-1 rounded text-xs ${
                    event.status === key ? config.color + ' text-white' : 'bg-dark-border text-dark-muted'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {event.keyword && (
            <div>
              <label className="text-sm text-dark-muted">Keyword cible</label>
              <p className="text-white">{event.keyword}</p>
            </div>
          )}

          {event.site && (
            <div>
              <label className="text-sm text-dark-muted">Site</label>
              <p className="text-white">{event.site}</p>
            </div>
          )}

          <div>
            <label className="text-sm text-dark-muted">Date prévue</label>
            <p className="text-white">
              {new Date(event.scheduled_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Add event modal
function AddEventModal({ date, sites, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      site_id: siteId || null,
      keyword: keyword.trim() || null,
      scheduled_date: date.toISOString().split('T')[0],
      status: 'idea'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">
          Nouveau contenu - {date.toLocaleDateString('fr-FR')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white"
            >
              <option value="">Sélectionner un site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.mcp_alias || site.domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Keyword cible</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Mot-clé principal..."
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [addingDate, setAddingDate] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load sites
      const sitesData = await sitesApi.getAll();
      setSites(sitesData || []);

      // Load articles as calendar events
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*, sites(mcp_alias, domain)')
        .order('scheduled_date', { ascending: true });

      if (!error && articles) {
        setEvents(articles.map(a => ({
          id: a.id,
          title: a.title,
          scheduled_date: a.scheduled_date || a.created_at,
          status: a.status || 'idea',
          keyword: a.target_keyword,
          site: a.sites?.mcp_alias || a.sites?.domain,
          site_id: a.site_id
        })));
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!confirm('Générer un planning de publication automatique ?\n\nCela analysera vos contenus en attente et proposera un calendrier optimisé.')) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await n8nApi.triggerWebhook('calendar-optimize', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });

      if (result.success) {
        alert('Optimisation du calendrier lancée ! Le planning sera mis à jour dans quelques minutes.');
        setTimeout(loadData, 5000);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calendar navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const current = new Date(startDate);

    // Generate 6 weeks
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.scheduled_date?.startsWith(dateStr));
  };

  // Add new event
  const handleAddEvent = async (eventData) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([{
          title: eventData.title,
          site_id: eventData.site_id,
          target_keyword: eventData.keyword,
          scheduled_date: eventData.scheduled_date,
          status: eventData.status
        }])
        .select()
        .single();

      if (!error && data) {
        setEvents([...events, {
          id: data.id,
          title: data.title,
          scheduled_date: data.scheduled_date,
          status: data.status,
          keyword: data.target_keyword,
          site_id: data.site_id
        }]);
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }
    setAddingDate(null);
  };

  // Update event status
  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: updatedEvent.status })
        .eq('id', updatedEvent.id);

      if (!error) {
        setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = new Date();

  // Stats
  const stats = {
    total: events.length,
    thisMonth: events.filter(e => {
      const d = new Date(e.scheduled_date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length,
    inProgress: events.filter(e => ['writing', 'review'].includes(e.status)).length,
    scheduled: events.filter(e => e.status === 'scheduled').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendrier Editorial</h1>
          <p className="text-dark-muted mt-1">Planifiez votre production de contenu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleAutoSchedule} disabled={isSyncing}>
            <Calendar className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Optimisation...' : 'Auto-planifier'}
          </Button>
          <Button onClick={() => setAddingDate(new Date())}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau contenu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-dark-muted">Total contenus</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <FileText className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.thisMonth}</div>
              <div className="text-sm text-dark-muted">Ce mois</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
              <div className="text-sm text-dark-muted">En cours</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Send className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.scheduled}</div>
              <div className="text-sm text-dark-muted">Planifies</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${config.color}`} />
              <span className="text-sm text-dark-muted">{config.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-4">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-dark-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => (
            <DayCell
              key={i}
              date={date}
              isCurrentMonth={date.getMonth() === currentDate.getMonth()}
              isToday={date.toDateString() === today.toDateString()}
              events={getEventsForDate(date)}
              onClick={(d) => setAddingDate(d)}
            />
          ))}
        </div>
      </Card>

      {/* Modals */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdateEvent}
        />
      )}

      {addingDate && (
        <AddEventModal
          date={addingDate}
          sites={sites}
          onClose={() => setAddingDate(null)}
          onAdd={handleAddEvent}
        />
      )}
    </div>
  );
}
