package com.digitalseal.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Create brand request payload")
public class CreateBrandRequest {
    
    @NotBlank(message = "Brand name is required")
    @Size(min = 2, max = 255, message = "Brand name must be between 2 and 255 characters")
    @Schema(description = "Brand name", example = "Louis Vuitton")
    private String brandName;
    
    @Email(message = "Invalid company email format")
    @Schema(description = "Company email address", example = "contact@louisvuitton.com")
    private String companyEmail;
    
    @Schema(description = "Company physical address", example = "2 Rue du Pont Neuf, Paris, France")
    private String companyAddress;
    
    @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Invalid Ethereum address format")
    @Schema(description = "Company Ethereum wallet address (optional)", example = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    private String companyWalletAddress;
    
    @Schema(description = "Brand logo URL", example = "https://example.com/logo.png")
    private String logo;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(description = "Brand description", example = "French luxury fashion house founded in 1854")
    private String description;
}
