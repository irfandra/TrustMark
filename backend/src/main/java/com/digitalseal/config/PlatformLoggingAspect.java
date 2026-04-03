package com.digitalseal.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@Slf4j
public class PlatformLoggingAspect {

    @Around("execution(* com.digitalseal.controller.*.*(..))")
    public Object logControllerCall(ProceedingJoinPoint pjp) throws Throwable {

        long start = System.currentTimeMillis();

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

        Long   userId    = null;
        String userEmail = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof String)) {
            try { userId = Long.parseLong(auth.getName()); } catch (NumberFormatException ignored) {}
        }

        String className = pjp.getTarget().getClass().getSimpleName();
        String category = categoryForClass(className);

        String action = buildAction(httpMethod, requestPath);

        Throwable caught = null;
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            caught = t;
            throw t;
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            boolean success = caught == null;
            String errorMsg = caught != null ? caught.getClass().getSimpleName() + ": " + caught.getMessage() : null;
            String line = "action=" + action
                    + " category=" + category
                    + " userId=" + (userId == null ? "-" : userId)
                    + " userEmail=" + (userEmail == null ? "-" : userEmail)
                    + " method=" + httpMethod
                    + " path=" + requestPath
                    + " ip=" + (ipAddress == null ? "-" : ipAddress)
                    + " userAgent=" + (userAgent == null ? "-" : userAgent)
                    + " durationMs=" + durationMs
                    + " success=" + success;

            if (success) {
                log.info(line);
            } else if (isWarnException(caught)) {
                log.warn("{} error={}", line, errorMsg);
            } else {
                log.error("{} error={}", line, errorMsg);
            }
        }
    }


    private String categoryForClass(String name) {
        if (name.startsWith("Auth"))        return "AUTH";
        if (name.startsWith("Order"))       return "ORDER";
        if (name.startsWith("Product"))     return "PRODUCT";
        if (name.startsWith("Brand"))       return "BRAND";
        if (name.startsWith("User"))        return "USER";
        return "SYSTEM";
    }

    private String buildAction(String method, String path) {
        String stripped = path.replaceFirst("^/api/v\\d+", "");
        String normalised = stripped.replaceAll("/\\d+", "/{id}");
        return method + " " + normalised;
    }

    private boolean isWarnException(Throwable t) {
        String name = t.getClass().getSimpleName();
        return name.contains("NotFound") || name.contains("InvalidState") || name.contains("Unauthorized");
    }

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
