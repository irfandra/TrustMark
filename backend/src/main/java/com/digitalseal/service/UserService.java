package com.digitalseal.service;

import com.digitalseal.dto.request.ChangePasswordRequest;
import com.digitalseal.dto.request.ConnectWalletRequest;
import com.digitalseal.dto.request.UpdateEmailRequest;
import com.digitalseal.dto.request.UpdateProfileRequest;
import com.digitalseal.dto.response.UserResponse;
import com.digitalseal.exception.InvalidCredentialsException;
import com.digitalseal.exception.InvalidSignatureException;
import com.digitalseal.exception.UserAlreadyExistsException;
import com.digitalseal.model.entity.User;
import com.digitalseal.repository.UserRepository;
import com.digitalseal.util.SignatureVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SignatureVerifier signatureVerifier;
    
    /**
     * Get current user profile
     */
    public UserResponse getProfile(Long userId) {
        User user = findUserById(userId);
        return mapToUserResponse(user);
    }
    
    /**
     * Update profile (first name, last name)
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserById(userId);
        
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        
        User savedUser = userRepository.save(user);
        log.info("Profile updated for user ID: {}", userId);
        
        return mapToUserResponse(savedUser);
    }
    
    /**
     * Update email address
     */
    @Transactional
    public UserResponse updateEmail(Long userId, UpdateEmailRequest request) {
        User user = findUserById(userId);
        
        // Check if new email is already taken
        if (userRepository.existsByEmail(request.getNewEmail())) {
            throw new UserAlreadyExistsException("Email already in use");
        }
        
        user.setEmail(request.getNewEmail());
        user.setEmailVerified(false); // Reset verification on email change
        
        User savedUser = userRepository.save(user);
        log.info("Email updated for user ID: {}", userId);
        
        return mapToUserResponse(savedUser);
    }
    
    /**
     * Change password (requires current password)
     */
    @Transactional
    public UserResponse changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUserById(userId);
        
        // Verify current password
        if (user.getPasswordHash() == null || 
            !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        
        User savedUser = userRepository.save(user);
        log.info("Password changed for user ID: {}", userId);
        
        return mapToUserResponse(savedUser);
    }
    
    /**
     * Connect wallet to account
     */
    @Transactional
    public UserResponse connectWallet(Long userId, ConnectWalletRequest request) {
        User user = findUserById(userId);
        
        // Check if wallet is already connected to another account
        if (userRepository.existsByWalletAddress(request.getWalletAddress())) {
            throw new UserAlreadyExistsException("Wallet already connected to another account");
        }
        
        // Verify wallet signature
        boolean isValid = signatureVerifier.verifySignature(
            request.getWalletAddress(),
            request.getMessage(),
            request.getSignature()
        );
        
        if (!isValid) {
            throw new InvalidSignatureException("Invalid wallet signature");
        }
        
        user.setWalletAddress(request.getWalletAddress());
        user.setWalletVerified(true);
        
        User savedUser = userRepository.save(user);
        log.info("Wallet connected for user ID: {}", userId);
        
        return mapToUserResponse(savedUser);
    }
    
    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
   public UserResponse mapToUserResponse(User user) {
    return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())    // ← add
            .lastName(user.getLastName())      // ← add     // ← add
            .phoneNumber(user.getPhoneNumber())
            .walletAddress(user.getWalletAddress())
            .role(user.getRole() != null ? user.getRole().name() : null)
            .authType(user.getAuthType() != null ? user.getAuthType().name() : null)
            .emailVerified(user.getEmailVerified())
            .walletVerified(user.getWalletVerified())
            .createdAt(user.getCreatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .build();
}
}
