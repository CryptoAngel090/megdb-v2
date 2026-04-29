'use client'

// client: local profile UI, tabs, client-only auth stub (getUser/saveUser)

import { Button } from '@repo/ui/button'
import {
  Bookmark,
  Camera,
  CheckCircle,
  Clock,
  Compass,
  Film,
  Globe,
  Heart,
  LogOut,
  Pencil,
  Star,
  Tv,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import { clearUser, getUser, saveUser, type User } from '@/lib/auth-client'
import styles from './ProfilePage.module.css'

// ─── Icons ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = 'overview' | 'watchlist' | 'ratings' | 'favorites' | 'statistics' | 'settings'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'settings', label: 'Settings' },
]

// ─── Quick Stats ──────────────────────────────────────────────────────────────

const QUICK_STATS = [
  { icon: <Bookmark className={`${iconSlot.block} ${iconSlot.lg}`} />, num: 0, label: 'Watchlist' },
  {
    icon: <CheckCircle className={`${iconSlot.block} ${iconSlot.lg}`} />,
    num: 0,
    label: 'Watched',
  },
  { icon: <Star className={`${iconSlot.block} ${iconSlot.lg}`} />, num: 0, label: 'Ratings' },
  { icon: <Heart className={`${iconSlot.block} ${iconSlot.lg}`} />, num: 0, label: 'Favorites' },
]

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ user }: { user: User }) {
  return (
    <div className={styles.tabPane}>
      <div className={styles.welcomeRow}>
        <h2 className={styles.welcomeTitle}>Welcome back, {user.name}!</h2>
        <p className={styles.welcomeSub}>Here&apos;s your personal dashboard.</p>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Recently Active</h3>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎬</div>
          <p className={styles.emptyText}>No recent activity yet.</p>
          <p className={styles.emptySubText}>
            Start watching movies and series to see your history here.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <Link href="/movies" className={styles.actionCard}>
            <div className={styles.actionCardIcon}>
              <Film className={`${iconSlot.block} ${iconSlot.xl}`} />
            </div>
            <span className={styles.actionCardLabel}>Browse Movies</span>
            <span className={styles.actionCardArrow}>→</span>
          </Link>
          <Link href="/series" className={styles.actionCard}>
            <div className={styles.actionCardIcon}>
              <Tv className={`${iconSlot.block} ${iconSlot.xl}`} />
            </div>
            <span className={styles.actionCardLabel}>Browse Series</span>
            <span className={styles.actionCardArrow}>→</span>
          </Link>
          <Link href="/search" className={styles.actionCard}>
            <div className={styles.actionCardIcon}>
              <Compass className={`${iconSlot.block} ${iconSlot.xl}`} />
            </div>
            <span className={styles.actionCardLabel}>Search</span>
            <span className={styles.actionCardArrow}>→</span>
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Activity</h3>
        <div className={styles.timeline}>
          <div className={styles.timelineEmpty}>
            <div className={styles.timelineLine} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.timelineDot} />
            ))}
            <p className={styles.timelineEmptyText}>Your activity timeline will appear here</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Watchlist Tab ────────────────────────────────────────────────────────────

type WatchlistFilter = 'all' | 'watching' | 'planned' | 'completed'

const WATCHLIST_FILTERS: { id: WatchlistFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'watching', label: 'Watching' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
]

function WatchlistTab() {
  const [filter, setFilter] = useState<WatchlistFilter>('all')

  return (
    <div className={styles.tabPane}>
      <div className={styles.filterPills}>
        {WATCHLIST_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`${styles.pill} ${filter === f.id ? styles.pillActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎞️</div>
        <p className={styles.emptyText}>No movies yet.</p>
        <p className={styles.emptySubText}>Start exploring and add movies to your watchlist.</p>
        <Link href="/movies" className={styles.emptyAction}>
          Browse Movies
        </Link>
      </div>
    </div>
  )
}

// ─── Ratings Tab ──────────────────────────────────────────────────────────────

function RatingsTab() {
  return (
    <div className={styles.tabPane}>
      <div className={styles.ratingsHeader}>
        <div className={styles.avgRatingCard}>
          <span className={styles.avgRatingLabel}>Average Rating</span>
          <span className={styles.avgRatingValue}>N/A</span>
          <span className={styles.avgRatingSubLabel}>No ratings yet</span>
        </div>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <p className={styles.emptyText}>No ratings yet.</p>
        <p className={styles.emptySubText}>Rate movies and series to track your opinions.</p>
        <Link href="/movies" className={styles.emptyAction}>
          Browse Movies
        </Link>
      </div>
    </div>
  )
}

// ─── Favorites Tab ────────────────────────────────────────────────────────────

function FavoritesTab() {
  return (
    <div className={styles.tabPane}>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>❤️</div>
        <p className={styles.emptyText}>No favorites yet.</p>
        <p className={styles.emptySubText}>Heart movies and series to save them here.</p>
        <Link href="/movies" className={styles.emptyAction}>
          Browse Movies
        </Link>
      </div>
    </div>
  )
}

// ─── Statistics Tab ───────────────────────────────────────────────────────────

const BIG_STATS = [
  {
    icon: <Clock className={`${iconSlot.block} ${iconSlot.xl}`} />,
    value: '0h',
    label: 'Total Watch Time',
  },
  {
    icon: <Film className={`${iconSlot.block} ${iconSlot.xl}`} />,
    value: '0',
    label: 'Movies Seen',
  },
  {
    icon: <Star className={`${iconSlot.block} ${iconSlot.xl}`} />,
    value: '—',
    label: 'Avg Rating',
  },
  {
    icon: <Globe className={`${iconSlot.block} ${iconSlot.xl}`} />,
    value: '0',
    label: 'Genres Explored',
  },
]

const PLACEHOLDER_GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi']

function StatisticsTab() {
  return (
    <div className={styles.tabPane}>
      <div className={styles.statsGrid}>
        {BIG_STATS.map((s, i) => (
          <div
            key={s.label}
            className={styles.bigStatCard}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={styles.bigStatIcon}>{s.icon}</div>
            <div className={styles.bigStatValue}>{s.value}</div>
            <div className={styles.bigStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Genres</h3>
        <div className={styles.genreList}>
          {PLACEHOLDER_GENRES.map((genre) => (
            <div key={genre} className={styles.genreRow}>
              <span className={styles.genreName}>{genre}</span>
              <div className={styles.genreBarWrap}>
                <div className={styles.genreBar} />
              </div>
              <span className={styles.genreCount}>0</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Activity Heatmap</h3>
        <div className={styles.heatmapPlaceholder}>
          <div className={styles.heatmapIcon}>📅</div>
          <p className={styles.heatmapText}>Start watching to see your activity</p>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Rating Distribution</h3>
        <div className={styles.ratingBars}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <div key={n} className={styles.ratingBarRow}>
              <span className={styles.ratingBarLabel}>{n}</span>
              <div className={styles.ratingBarTrack}>
                <div className={styles.ratingBarFill} />
              </div>
              <span className={styles.ratingBarCount}>0</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleChecked : ''}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
    </button>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ user, onUserUpdate }: { user: User; onUserUpdate: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user.name)
  const [emailNotifs, setEmailNotifs] = useState(false)
  const [publicWatchlist, setPublicWatchlist] = useState(false)
  const [publicRatings, setPublicRatings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDirty = displayName !== user.name

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    const updated: User = { ...user, name: displayName }
    saveUser(updated)
    onUserUpdate(updated)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.tabPane}>
      {/* Profile section */}
      <div className={styles.settingsCard}>
        <h3 className={styles.settingsTitle}>Profile</h3>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            className={styles.fieldInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={`${styles.fieldInput} ${styles.fieldInputReadonly}`}
            value={user.username}
            readOnly
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={`${styles.fieldInput} ${styles.fieldInputReadonly}`}
            value={user.email}
            readOnly
          />
        </div>

        <div className={styles.settingsSaveWrap}>
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            loading={saving}
            disabled={!isDirty || saving}
            onClick={() => {
              void handleSave()
            }}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Preferences section */}
      <div className={styles.settingsCard}>
        <h3 className={styles.settingsTitle}>Preferences</h3>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Email notifications</span>
            <span className={styles.toggleDesc}>
              Receive updates about new releases and recommendations
            </span>
          </div>
          <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Show my watchlist publicly</span>
            <span className={styles.toggleDesc}>Let others see what you plan to watch</span>
          </div>
          <Toggle checked={publicWatchlist} onChange={setPublicWatchlist} />
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Show my ratings publicly</span>
            <span className={styles.toggleDesc}>Let others see your movie ratings</span>
          </div>
          <Toggle checked={publicRatings} onChange={setPublicRatings} />
        </div>
      </div>

      {/* Danger zone */}
      <div className={`${styles.settingsCard} ${styles.dangerZone}`}>
        <h3 className={`${styles.settingsTitle} ${styles.dangerTitle}`}>Danger Zone</h3>
        <div className={styles.dangerActions}>
          <Button type="button" variant="secondary" size="md" onClick={() => void 0}>
            Change Password
          </Button>
          <Button type="button" variant="danger" size="md" onClick={() => void 0}>
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.replace('/login')
      return
    }
    setUser(u)
    setLoading(false)
  }, [router])

  function handleLogout() {
    clearUser()
    router.push('/')
  }

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleTabClick(id: TabId) {
    setActiveTab(id)
    if (id === 'settings') {
      // scroll to top of content
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading profile…</span>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={styles.root}>
      {/* ── Hero Header ── */}
      <header className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            {/* Avatar */}
            <div className={styles.avatarWrap} onClick={handleAvatarClick} title="Change photo">
              <div className={styles.avatar}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.name} profile photo`}
                    className={styles.avatarImg}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>{getInitials(user.name)}</div>
                )}
              </div>
              <div className={styles.avatarEditHint}>
                <Camera className={`${iconSlot.block} ${iconSlot.md}`} />
                <span>Change photo</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.avatarInput}
                aria-label="Upload avatar"
              />
            </div>

            {/* User meta */}
            <div className={styles.userMeta}>
              <h1 className={styles.userName}>{user.name}</h1>
              <p className={styles.userHandle}>@{user.username}</p>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.userBadgeRow}>
                <span className={styles.memberSince}>
                  Member since {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Hero actions */}
          <div className={styles.heroActions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleTabClick('settings')}
            >
              <Pencil className={`${iconSlot.block} ${iconSlot.sm}`} />
              Edit Profile
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={handleLogout}>
              <LogOut className={`${iconSlot.block} ${iconSlot.sm}`} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ── Quick Stats ── */}
      <div className={styles.quickStats}>
        <div className={styles.quickStatsInner}>
          {QUICK_STATS.map((s, i) => (
            <div
              key={s.label}
              className={styles.statCard}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs Bar ── */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsInner}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabClick(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page Content ── */}
      <main className={styles.pageContent}>
        <div key={activeTab}>
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'watchlist' && <WatchlistTab />}
          {activeTab === 'ratings' && <RatingsTab />}
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
          {activeTab === 'settings' && <SettingsTab user={user} onUserUpdate={setUser} />}
        </div>
      </main>
    </div>
  )
}
