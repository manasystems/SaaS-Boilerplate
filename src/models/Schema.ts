import { integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  companyName: text('company_name'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  companyName: text('company_name'),
  companyAddress: text('company_address'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  logoUrl: text('logo_url'),
  accentColor: text('accent_color'),
  licenseNumber: text('license_number'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const estimates = pgTable('estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const lineItems = pgTable('line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  estimateId: uuid('estimate_id')
    .notNull()
    .references(() => estimates.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('1'),
  unit: text('unit'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const markupRows = pgTable('markup_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  estimateId: uuid('estimate_id')
    .notNull()
    .references(() => estimates.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  percentage: numeric('percentage', { precision: 6, scale: 3 }).notNull().default('0'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const feedbackTable = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
