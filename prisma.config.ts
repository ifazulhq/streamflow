try {
  require("dotenv/config");
} catch {
  // ignore if dotenv not in root
}

export default {
  schema: "api-server/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
