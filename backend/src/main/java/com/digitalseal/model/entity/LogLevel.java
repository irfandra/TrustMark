package com.digitalseal.model.entity;

/**
 * Severity level for a platform log entry.
 */
public enum LogLevel {
    /** Normal operational event — login, order placed, item generated */
    INFO,
    /** Something unexpected but non-fatal — invalid attempt, slow call */
    WARN,
    /** A failure that needs attention — integration error, DB constraint, exception */
    ERROR
}
