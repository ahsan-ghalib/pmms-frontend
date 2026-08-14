module.exports = {
  apps: [
    {
      name: "soouqlive-frontend",
      script: "npm",
      args: "start",
      env: {
        PORT: 3000,        // change port here
        NODE_ENV: "production"
      }
    }
  ]
};
