module.exports = {
  apps: [
    {
      name: "ohstatus",
      script: "build/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5174,
      },
    },
  ],
};
