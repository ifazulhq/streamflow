require('temporal-polyfill/global');
require('dotenv/config');
const postgres = require('@prisma/orm-postgres/runtime').default;
const contractJson = require('./contract.json');

const db = postgres({
  contractJson,
  url: process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/videodb?schema=public',
});

class PrismaClient {
  constructor() {
    this.video = {
      create: async ({ data }) => {
        return db.orm.public.Video.create({
          title: data.title,
          originalName: data.originalName,
          uploadId: data.uploadId,
          status: data.status || 'UPLOADING',
          progress: data.progress !== undefined ? data.progress : 0,
          masterPlaylist: data.masterPlaylist,
          resolutions: data.resolutions || [],
          posterUrl: data.posterUrl,
          storyboardUrl: data.storyboardUrl,
          views: data.views !== undefined ? data.views : 0,
          userId: data.userId || null,
        });
      },
      update: async ({ where, data }) => {
        const updateData = { ...data };
        if (data.views && typeof data.views === 'object' && data.views.increment) {
          const current = await db.orm.public.Video.where(where).first();
          updateData.views = (current ? Number(current.views || 0) : 0) + Number(data.views.increment);
        }
        return db.orm.public.Video.where(where).update(updateData);
      },
      findUnique: async ({ where, include }) => {
        const v = await db.orm.public.Video.where(where).first();
        if (v && include) {
          if (include.engagement) {
            v.engagement = await db.orm.public.VideoEngagement.where({ videoId: v.id }).first();
          }
          if (include.user && v.userId) {
            v.user = await db.orm.public.User.where({ id: v.userId }).first();
          }
        }
        return v;
      },
      delete: async ({ where }) => {
        return db.orm.public.Video.where(where).delete();
      },
      findMany: async (args) => {
        if (args && args.where) {
          return db.orm.public.Video.where(args.where).all();
        }
        return db.orm.public.Video.all();
      },
    };

    this.videoEngagement = {
      create: async ({ data }) => {
        return db.orm.public.VideoEngagement.create(data);
      },
      update: async ({ where, data }) => {
        return db.orm.public.VideoEngagement.where(where).update(data);
      },
      findUnique: async ({ where }) => {
        return db.orm.public.VideoEngagement.where(where).first();
      },
      delete: async ({ where }) => {
        return db.orm.public.VideoEngagement.where(where).delete();
      },
    };

    this.user = {
      create: async ({ data }) => {
        return db.orm.public.User.create({
          id: data.id || undefined,
          name: data.name || null,
          email: data.email || null,
          emailVerified: data.emailVerified || null,
          image: data.image || null,
        });
      },
      findUnique: async ({ where }) => {
        return db.orm.public.User.where(where).first();
      },
      update: async ({ where, data }) => {
        return db.orm.public.User.where(where).update(data);
      },
      delete: async ({ where }) => {
        return db.orm.public.User.where(where).delete();
      },
      findMany: async (args) => {
        if (args && args.where) {
          return db.orm.public.User.where(args.where).all();
        }
        return db.orm.public.User.all();
      },
    };

    this.account = {
      create: async ({ data }) => {
        return db.orm.public.Account.create(data);
      },
      findUnique: async ({ where, select }) => {
        let condition = where;
        if (where && where.provider_providerAccountId) {
          condition = {
            provider: where.provider_providerAccountId.provider,
            providerAccountId: where.provider_providerAccountId.providerAccountId,
          };
        }
        const acc = await db.orm.public.Account.where(condition).first();
        if (acc && select && select.user) {
          acc.user = await db.orm.public.User.where({ id: acc.userId }).first();
        }
        return acc;
      },
      delete: async ({ where }) => {
        let condition = where;
        if (where && where.provider_providerAccountId) {
          condition = {
            provider: where.provider_providerAccountId.provider,
            providerAccountId: where.provider_providerAccountId.providerAccountId,
          };
        }
        return db.orm.public.Account.where(condition).delete();
      },
    };

    this.session = {
      create: async ({ data }) => {
        return db.orm.public.Session.create(data);
      },
      findUnique: async ({ where, include }) => {
        const sess = await db.orm.public.Session.where(where).first();
        if (sess && include && include.user) {
          sess.user = await db.orm.public.User.where({ id: sess.userId }).first();
        }
        return sess;
      },
      update: async ({ where, data }) => {
        return db.orm.public.Session.where(where).update(data);
      },
      delete: async ({ where }) => {
        return db.orm.public.Session.where(where).delete();
      },
    };

    this.verificationToken = {
      create: async ({ data }) => {
        return db.orm.public.VerificationToken.create(data);
      },
      delete: async ({ where }) => {
        let condition = where;
        if (where && where.identifier_token) {
          condition = {
            identifier: where.identifier_token.identifier,
            token: where.identifier_token.token,
          };
        }
        return db.orm.public.VerificationToken.where(condition).delete();
      },
    };

    this.db = db;
  }
}

module.exports = { PrismaClient, db };
