package com.digitalseal.config;

import com.digitalseal.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configure(http))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Dev mode override: make all endpoints callable without JWT.
            .anonymous(anonymous -> anonymous
                .principal("1")
                .authorities("ROLE_OWNER", "ROLE_BRAND")
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                // Brand public endpoints
                .requestMatchers(HttpMethod.GET, "/brands/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/brands/*/collections", "/brands/*/collections/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/brands/*/products").permitAll()
                .requestMatchers(HttpMethod.GET, "/brands/*/products/*/items").permitAll()
                // Product public endpoints
                .requestMatchers(HttpMethod.GET, "/products/**", "/products/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/collections/*/products").permitAll()
                // Marketplace (all public)
                .requestMatchers(HttpMethod.GET, "/marketplace", "/marketplace/**").permitAll()
                // Verification (all public)
                .requestMatchers(HttpMethod.GET, "/verify/**").permitAll()
                // Blockchain (status and verify are public)
                .requestMatchers(HttpMethod.GET, "/blockchain/status", "/blockchain/verify/**").permitAll()
                // Platform logs — authenticated + @PreAuthorize(BRAND/OWNER) on controller
                .requestMatchers("/admin/logs/**").authenticated()
                // Infrastructure
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
