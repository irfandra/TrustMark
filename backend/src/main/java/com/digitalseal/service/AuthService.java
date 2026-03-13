package com.digitalseal.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalseal.dto.request.EmailLoginRequest;
import com.digitalseal.dto.request.EmailRegisterRequest;
import com.digitalseal.dto.request.ForgotPasswordRequest;
import com.digitalseal.dto.request.ResetPasswordRequest;
import com.digitalseal.dto.request.VerifyEmailRequest;
import com.digitalseal.dto.request.WalletLoginRequest;
import com.digitalseal.dto.request.WalletRegisterRequest;
import com.digitalseal.dto.response.AuthResponse;
// ...existing code...
import com.digitalseal.exception.AccountLockedException;
import com.digitalseal.exception.InvalidCredentialsException;
import com.digitalseal.exception.InvalidSignatureException;
import com.digitalseal.exception.UserAlreadyExistsException;
import com.digitalseal.model.entity.AuthType;
import com.digitalseal.model.entity.RefreshToken;
import com.digitalseal.model.entity.User;
import com.digitalseal.model.entity.UserRole;
import com.digitalseal.model.entity.VerificationType;
import com.digitalseal.repository.UserRepository;
import com.digitalseal.security.JwtTokenProvider;
import com.digitalseal.util.SignatureVerifier;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SignatureVerifier signatureVerifier;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final VerificationService verificationService;
    private final UserService userService;
    
    /**
     * Register user with email and password
     */
    @Transactional
    public AuthResponse registerWithEmail(EmailRegisterRequest request, String deviceInfo, String ipAddress) {
        log.info("Registering user with email: {}", request.getEmail());
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }
        
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .authType(AuthType.EMAIL)
                .role(UserRole.OWNER)
                .isActive(true)
                .emailVerified(false)
                .walletVerified(false)
                .build();
        
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());
        
        // Send verification email
        String code = verificationService.generateCode(savedUser, VerificationType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(savedUser.getEmail(), code, savedUser.getFirstName());
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(savedUser);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser, deviceInfo, ipAddress);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userService.mapToUserResponse(savedUser))
                .build();
    }
    
    /**
     * Login with email and password
     */
    @Transactional
    public AuthResponse loginWithEmail(EmailLoginRequest request, String deviceInfo, String ipAddress) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        
        // Check if account is locked
        if (user.getIsLocked()) {
            throw new AccountLockedException("Account locked due to multiple failed login attempts");
        }
        
        // Check if account is active
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is not active");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.incrementFailedAttempts();
            userRepository.save(user);
            throw new InvalidCredentialsException("Invalid email or password");
        }
        
        // Reset failed attempts
        user.resetFailedAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("User logged in successfully: {}", user.getEmail());
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userService.mapToUserResponse(user))
                .build();
    }
    
    /**
     * Get nonce for wallet authentication
     */
    public AuthResponse getWalletNonce(String walletAddress) {
        log.info("Nonce request for wallet: {}", walletAddress);
        
        User user = userRepository.findByWalletAddress(walletAddress)
                .orElse(null);
        
        String nonce;
        if (user != null) {
            nonce = user.getWalletNonce();
        } else {
            nonce = "nonce_" + System.currentTimeMillis() + "_" + Math.random();
        }
        
        String message = String.format(
            "Sign this message to authenticate with Digital Seal:\n\n" +
            "Wallet: %s\n" +
            "Nonce: %s\n" +
            "Timestamp: %s\n\n" +
            "This request will not trigger a blockchain transaction or cost any gas fees.",
            walletAddress,
            nonce,
            LocalDateTime.now()
        );
        
        return AuthResponse.builder()
                .nonce(nonce)
                .message(message)
                .build();
    }
    
    /**
     * Register user with wallet signature
     */
    @Transactional
    public AuthResponse registerWithWallet(WalletRegisterRequest request, String deviceInfo, String ipAddress) {
        log.info("Registering user with wallet: {}", request.getWalletAddress());
        
        // Check if wallet already exists
        if (userRepository.existsByWalletAddress(request.getWalletAddress())) {
            throw new UserAlreadyExistsException("Wallet already registered");
        }
        
        // Verify signature
        boolean isValid = signatureVerifier.verifySignature(
            request.getWalletAddress(),
            request.getMessage(),
            request.getSignature()
        );
        
        if (!isValid) {
            throw new InvalidSignatureException("Invalid wallet signature");
        }
        
        // Create user
        User user = User.builder()
                .walletAddress(request.getWalletAddress())
                .authType(AuthType.WALLET)
                .role(UserRole.OWNER)
                .isActive(true)
                .emailVerified(false)
                .walletVerified(true)
                .build();
        
        User savedUser = userRepository.save(user);
        log.info("User registered with wallet, ID: {}", savedUser.getId());
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(savedUser);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser, deviceInfo, ipAddress);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userService.mapToUserResponse(savedUser))
                .build();
    }
    
    /**
     * Login with wallet signature
     */
    @Transactional
    public AuthResponse loginWithWallet(WalletLoginRequest request, String deviceInfo, String ipAddress) {
        log.info("Wallet login attempt: {}", request.getWalletAddress());
        
        // Find user
        User user = userRepository.findByWalletAddress(request.getWalletAddress())
                .orElseThrow(() -> new RuntimeException("Wallet not registered. Please sign up first."));
        
        // Check if account is active
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is not active");
        }
        
        // Verify signature
        boolean isValid = signatureVerifier.verifySignature(
            request.getWalletAddress(),
            request.getMessage(),
            request.getSignature()
        );
        
        if (!isValid) {
            throw new InvalidSignatureException("Invalid wallet signature");
        }
        
        // Update user
        user.setLastLoginAt(LocalDateTime.now());
        user.regenerateNonce(); // Generate new nonce for next login
        userRepository.save(user);
        
        log.info("User logged in with wallet: {}", user.getWalletAddress());
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userService.mapToUserResponse(user))
                .build();
    }
    
    /**
     * Refresh access token
     */
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr, String deviceInfo, String ipAddress) {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        
        refreshTokenService.verifyExpiration(refreshToken);
        
        if (refreshToken.getIsRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }
        
        User user = refreshToken.getUser();
        
        // Generate new tokens
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);
        
        // Revoke old refresh token
        refreshTokenService.revokeToken(refreshTokenStr);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .build();
    }
    
    /**
     * Logout user
     */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeToken(refreshToken);
    }
    
    /**
     * Verify email with 6-digit code
     */
    @Transactional
    public void verifyEmail(Long userId, VerifyEmailRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }
        
        verificationService.verifyCode(user, request.getCode(), VerificationType.EMAIL_VERIFICATION);
        
        user.setEmailVerified(true);
        userRepository.save(user);
        
        log.info("Email verified for user ID: {}", userId);
    }
    
    /**
     * Resend email verification code
     */
    @Transactional
    public void resendVerificationEmail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }
        
        if (user.getEmail() == null) {
            throw new RuntimeException("No email address associated with this account");
        }
        
        String code = verificationService.generateCode(user, VerificationType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(user.getEmail(), code, user.getFirstName());
        
        log.info("Verification email resent to user ID: {}", userId);
    }
    
    /**
     * Forgot password - send reset code to email
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);
        
        // Always return success to prevent email enumeration
        if (user == null) {
            log.warn("Password reset requested for unknown email: {}", request.getEmail());
            return;
        }
        
        String code = verificationService.generateCode(user, VerificationType.PASSWORD_RESET);
        emailService.sendPasswordResetEmail(user.getEmail(), code, user.getFirstName());
        
        log.info("Password reset code sent to: {}", request.getEmail());
    }
    
    /**
     * Reset password with verification code
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or code"));
        
        verificationService.verifyCode(user, request.getCode(), VerificationType.PASSWORD_RESET);
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.resetFailedAttempts(); // Unlock account if it was locked
        userRepository.save(user);
        
        log.info("Password reset successful for user ID: {}", user.getId());
    }
}
