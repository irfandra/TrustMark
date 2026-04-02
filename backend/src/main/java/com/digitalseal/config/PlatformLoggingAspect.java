package com.digitalseal.config;

import com.digitalseal.model.entity.LogCategory;
import com.digitalseal.model.entity.LogLevel;
import com.digitalseal.service.PlatformLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * AOP aspect that intercepts every REST controller method and writes a
 * {@link com.digitalseal.model.entity.PlatformLog} entry for each call.
 *
 * <p>The log records: who called it, what path/method, how long it took,
 * whether it succeeded, and the error message if it failed.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class PlatformLoggingAspect {

    private final PlatformLogService platformLogService;

    /**
     * Intercept all public methods inside any {@code @RestController} in the
     * {@code com.digitalseal.controller} package.
     */
    @Around("execution(* com.digitalseal.controller.*.*(..))")
    public Object logControllerCall(ProceedingJoinPoint pjp) throws Throwable {

        long start = System.currentTimeMillis();

        // ── HTTP context ──────────────────────────────────────────────────
        String httpMethod   = "UNKNOWN";
        String requestPath  = "UNKNOWN";
        String ipAddress    = null;
        String userAgent    = null;

        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            httpMethod  = req.getMethod();
            requestPath = req.getRequestURI();
            ipAddress   = resolveClientIp(req);
            userAgent   = truncate(req.getHeader("User-Agent"), 500);
        }

        // ── Caller identity ───────────────────────────────────────────────
        Long   userId    = null;
        String userEmail = null;  // kept null — aspect has no user repo; service-level logs carry email

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof String)) {
            try { userId = Long.parseLong(auth.getName()); } catch (NumberFormatException ignored) {}
        }

        // ── Category (derived from controller class name) ─────────────────
        String className = pjp.getTarget().getClass().getSimpleName();
        LogCategory category = categoryForClass(className);

        // ── Action (derived from HTTP method + path) ───────────────────────
        String action = buildAction(httpMethod, requestPath);

        // ── Proceed ───────────────────────────────────────────────────────
        Throwable caught = null;
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            caught = t;
            throw t;
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            boolean success = caught == null;
            LogLevel level  = success ? LogLevel.INFO : levelForException(caught);
            String errorMsg = caught != null ? caught.getClass().getSimpleName() + ": " + caught.getMessage() : null;

            platformLogService.logRequest(
                    level, category, action,
                    userId, userEmail,
                    httpMethod, requestPath,
                    ipAddress, userAgent,
                    durationMs, success,
                    null,      // details — could be serialised body, kept null for brevity
                    errorMsg
            );
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Map a controller class name to the most relevant LogCategory */
    private LogCategory categoryForClass(String name) {
        if (name.startsWith("Auth"))        return LogCategory.AUTH;
        if (name.startsWith("Order"))       return LogCategory.ORDER;
        if (name.startsWith("Product"))     return LogCategory.PRODUCT;
        if (name.startsWith("Brand"))       return LogCategory.BRAND;
        if (name.startsWith("User"))        return LogCategory.USER;
        if (name.startsWith("PlatformLog")) return LogCategory.SYSTEM;
        return LogCategory.SYSTEM;
    }

    /**
     * Build a short action key from the HTTP method and path.
     * Path IDs like /orders/42/ship are normalised to /orders/{id}/ship.
     */
    private String buildAction(String method, String path) {
        // Strip /api/v1 prefix, then normalise numeric segments to {id}
        String stripped = path.replaceFirst("^/api/v\\d+", "");
        String normalised = stripped.replaceAll("/\\d+", "/{id}");
        return method + " " + normalised;
    }

    /** Determine the appropriate log level from the thrown exception type */
    private LogLevel levelForException(Throwable t) {
        String name = t.getClass().getSimpleName();
        if (name.contains("NotFound") || name.contains("InvalidState") || name.contains("Unauthorized")) {
            return LogLevel.WARN; // expected business errors
        }
        return LogLevel.ERROR; // unexpected errors
    }

    /** Prefer X-Forwarded-For (reverse proxy), then remote address */
    private String resolveClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
