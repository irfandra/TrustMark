package com.digitalseal.config;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

// unused imports removed

@Configuration
public class OpenAPIConfig {
    
    @Value("${server.port:8080}")
    private String serverPort;
    
    @Bean
    public OpenAPI digitalSealOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TrustMark API")
                        .description("Creator product catalog and fulfillment API")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("TrustMark Team")
                                .email("support@trustmark.app"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api/v1")
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.trustmark.app/api/v1")
                                .description("Production Server")));
    }
}
