package com.digitalseal.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalseal.model.entity.User;
import com.digitalseal.model.entity.VerificationCode;
import com.digitalseal.model.entity.VerificationType;
import com.digitalseal.repository.VerificationCodeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class VerificationService {
    
    private static final SecureRandom RANDOM = new SecureRandom();
    
    private final VerificationCodeRepository verificationCodeRepository;
    
    @Value("${app.verification.code-expiry-minutes}")
    private int codeExpiryMinutes;
    
    @Value("${app.verification.max-attempts}")
    private int maxAttempts;
    
    /**
     * Generate a 6-digit verification code
     */
    @Transactional
    public String generateCode(User user, VerificationType type) {
        // ...existing code...
        
        String code = String.format("%06d", RANDOM.nextInt(1000000));
        
        VerificationCode verificationCode = VerificationCode.builder()
                .user(user)
                .code(code)
                .type(type)
                .expiresAt(LocalDateTime.now().plusMinutes(codeExpiryMinutes))
                .isUsed(false)
                .attempts(0)
                .build();
        
        verificationCodeRepository.save(verificationCode);
        log.info("Verification code generated for user ID: {}, type: {}", user.getId(), type);
        
        return code;
    }
    
    /**
     * Verify a code
     * @return true if code is valid, false otherwise
     */
    @Transactional
    public boolean verifyCode(User user, String code, VerificationType type) {
        VerificationCode verificationCode = verificationCodeRepository
                .findTopByUserAndTypeAndIsUsedFalseOrderByCreatedAtDesc(user, type)
                .orElseThrow(() -> new RuntimeException("No verification code found. Please request a new one."));
        
        // Check if expired
        if (verificationCode.isExpired()) {
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }
        
        // Check max attempts
        if (verificationCode.getAttempts() >= maxAttempts) {
            throw new RuntimeException("Too many failed attempts. Please request a new code.");
        }
        
        // Increment attempts
        verificationCode.incrementAttempts();
        verificationCodeRepository.save(verificationCode);
        
        // Check code
        if (!verificationCode.getCode().equals(code)) {
            int remaining = maxAttempts - verificationCode.getAttempts();
            throw new RuntimeException("Invalid verification code. " + remaining + " attempts remaining.");
        }
        
        // Mark as used
        verificationCode.markUsed();
        verificationCodeRepository.save(verificationCode);
        
        log.info("Verification code verified for user ID: {}, type: {}", user.getId(), type);
        return true;
    }
    
    /**
     * Clean up expired codes
     */
}
