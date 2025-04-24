/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.URL || 'http://example.com',
    generateRobotsTxt: true,
    generateIndexSitemap: true,
    exclude: ['/api/*', '/admin/*'],
    additionalPaths: async (config) => {
      // Fetching the blog data
      const response = await fetch("https://jsonplaceholder.typicode.com/posts");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const posts = await response.json();
  
      // Generating the paths for the blog posts
      const blogPaths = posts.map((post) => ({
        loc: `${config.siteUrl}/blog/${post.title.replace(/ /g, '_')}_${post.id}`,
        changefreq: 'daily',
        priority: 0.7,
      }));
  
      return blogPaths;
    }
  };
  