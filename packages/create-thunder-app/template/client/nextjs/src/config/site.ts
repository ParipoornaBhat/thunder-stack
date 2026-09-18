export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
  url: string;
  ogImage: string;
  author: {
    name: string;
    url: string;
    github: string;
    linkedin: string;
  };
  links: {
    github: string;
    npm: string;
    docs: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "THUNDER Stack",
  shortName: "THUNDER",
  description: "Next.js 15, Hono (Cloudflare Workers), Drizzle ORM, and Expo 54 Full-Stack Monorepo Template.",
  url: "https://thunderstack.dev",
  ogImage: "/logos/thunder.png",
  author: {
    name: "Paripoorna B",
    url: "https://paripoorna.me",
    github: "https://github.com/ParipoornaBhat",
    linkedin: "https://www.linkedin.com/in/paripoorna-bhat/",
  },
  links: {
    github: "https://github.com/ParipoornaBhat/thunder-stack",
    npm: "https://www.npmjs.com/package/create-thunder-stack",
    docs: "/docs",
  },
};
