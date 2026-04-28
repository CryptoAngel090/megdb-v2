import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
  json,
} from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────

export const mediaTypeEnum = pgEnum('media_type', ['movie', 'series', 'cartoon', 'tvshow'])
export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])
export const reactionEnum = pgEnum('reaction_type', ['like', 'dislike'])
export const watchStatusEnum = pgEnum('watch_status', ['watching', 'completed', 'planned'])
export const commentStatusEnum = pgEnum('comment_status', ['pending', 'approved', 'rejected'])

// ── Media ─────────────────────────────────────

export const media = pgTable(
  'media',
  {
    id: serial('id').primaryKey(),
    tmdbId: integer('tmdb_id').notNull().unique(),
    type: mediaTypeEnum('type').notNull(),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    overview: text('overview').default(''),
    tagline: text('tagline'),
    posterPath: text('poster_path'),
    backdropPath: text('backdrop_path'),
    primaryColor: text('primary_color'),
    blurHash: text('blur_hash'),
    releaseDate: timestamp('release_date'),
    runtime: integer('runtime'),
    voteAverage: real('vote_average').default(0),
    voteCount: integer('vote_count').default(0),
    popularity: real('popularity').default(0),
    status: text('status'),
    adult: boolean('adult').default(false),
    syncedAt: timestamp('synced_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('media_type_idx').on(t.type),
    index('media_popularity_idx').on(t.popularity),
    index('media_vote_idx').on(t.voteAverage),
    index('media_release_idx').on(t.releaseDate),
  ]
)

// ── Persons ───────────────────────────────────

export const persons = pgTable('persons', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  name: text('name').notNull(),
  profilePath: text('profile_path'),
  biography: text('biography'),
  birthday: timestamp('birthday'),
  knownForDepartment: text('known_for_department'),
  popularity: real('popularity').default(0),
  syncedAt: timestamp('synced_at').defaultNow(),
})

// ── Genres ────────────────────────────────────

export const genres = pgTable('genres', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

// ── Categories ────────────────────────────────

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  mediaType: mediaTypeEnum('media_type'),
  filters: json('filters'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Relations: media ↔ genres ─────────────────

export const mediaGenres = pgTable(
  'media_genres',
  {
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('media_genre_unique').on(t.mediaId, t.genreId)]
)

// ── Relations: media ↔ persons ────────────────

export const mediaPersons = pgTable(
  'media_persons',
  {
    id: serial('id').primaryKey(),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    role: text('role'),
    character: text('character'),
    department: text('department'),
    order: integer('order').default(0),
  },
  (t) => [index('media_persons_media_idx').on(t.mediaId)]
)

// ── Videos (trailers, clips) ─────────────────

export const mediaVideos = pgTable('media_videos', {
  id: serial('id').primaryKey(),
  mediaId: integer('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull(),
  site: text('site').default('YouTube'),
  type: text('type').default('Trailer'),
  official: boolean('official').default(true),
})

// ── Users ─────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Comments ──────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    parentId: integer('parent_id'),
    isDeleted: boolean('is_deleted').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('comments_media_idx').on(t.mediaId), index('comments_user_idx').on(t.userId)]
)

// ── Reactions (likes / dislikes) ─────────────

export const reactions = pgTable(
  'reactions',
  {
    id: serial('id').primaryKey(),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: reactionEnum('type').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [uniqueIndex('reactions_unique').on(t.userId, t.mediaId)]
)

// ── Public movie feedback (anonymous one-vote per visitor) ─────

export const movieFeedbackVotes = pgTable(
  'movie_feedback_votes',
  {
    id: serial('id').primaryKey(),
    tmdbMovieId: integer('tmdb_movie_id').notNull(),
    visitorId: text('visitor_id').notNull(),
    vote: reactionEnum('vote').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('movie_feedback_unique_vote').on(t.tmdbMovieId, t.visitorId),
    index('movie_feedback_tmdb_idx').on(t.tmdbMovieId),
  ]
)

// ── Movie comments with moderation (email approval flow) ─────

export const movieComments = pgTable(
  'movie_comments',
  {
    id: serial('id').primaryKey(),
    tmdbMovieId: integer('tmdb_movie_id').notNull(),
    mediaType: mediaTypeEnum('media_type').notNull().default('movie'),
    authorName: text('author_name').notNull(),
    authorEmail: text('author_email').notNull(),
    body: text('body').notNull(),
    status: commentStatusEnum('status').notNull().default('pending'),
    moderationToken: text('moderation_token').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    reviewedAt: timestamp('reviewed_at'),
  },
  (t) => [
    uniqueIndex('movie_comments_token_unique').on(t.moderationToken),
    index('movie_comments_tmdb_idx').on(t.tmdbMovieId),
    index('movie_comments_media_type_idx').on(t.mediaType),
    index('movie_comments_status_idx').on(t.status),
  ]
)

// ── Watchlist ─────────────────────────────────

export const watchlist = pgTable(
  'watchlist',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    status: watchStatusEnum('status').default('planned'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    uniqueIndex('watchlist_unique').on(t.userId, t.mediaId),
    index('watchlist_user_idx').on(t.userId),
  ]
)
