import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = "logs"; // Directory path for logs
const oldLogsDir = "old_logs"; // Directory for old logs

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Ensure old logs directory exists
if (!fs.existsSync(oldLogsDir)) {
  fs.mkdirSync(oldLogsDir);
}

// Custom Winston transport to move old logs
class CustomRotateFile extends DailyRotateFile {
  constructor(opts) {
    super(opts);
    this.on("rotate", (oldFilename) => {
      const oldBaseName = path.basename(oldFilename);
      const dest = path.join(oldLogsDir, oldBaseName);
      fs.rename(oldFilename, dest, (err) => {
        if (err) console.error(`Error moving log file: ${err}`);
      });
    });
  }
}

// Create a Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) =>
        `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`
    )
  ),
  transports: [
    new CustomRotateFile({
      filename: `${logDir}/pastel_rpc_rest_wrapper_log-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "14d",
    }),
    new winston.transports.Console(),
  ],
});

export default logger;

// Optionally, configure additional loggers as needed
winston.loggers.add("sqlalchemy.engine", {
  level: "warning",
  // Add transports similar to the above, tailored to specific needs
});
