module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData('builtAt', () => {
    let now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long',
    }).format(now);
  });

  eleventyConfig.addPassthroughCopy('src/bundle.js');

  return {
    dir: {
      data: '../_data',
      input: 'src',
      output: '_site',
    },
    pathPrefix: 'me',
  };
};
