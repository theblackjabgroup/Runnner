module.exports = {
    plugins: [
        require('postcss-import'),
      require('postcss-preset-env')({
        stage: 1,
        features: {
          'custom-media-queries': true, // enable @custom-media
          'custom-properties': true      // enable var(--var-name)
        }
      }),
      require('postcss-custom-media')() // optional if you want extra support
    ]
  }
  