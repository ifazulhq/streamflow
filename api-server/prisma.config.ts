try {
  require("dotenv/config");
} catch {
  // ignore if dotenv not in directory
}

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
};
