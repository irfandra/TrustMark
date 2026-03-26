package com.digitalseal.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.web3j.crypto.ECDSASignature;
import org.web3j.crypto.Hash;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Component
@Slf4j
public class SignatureVerifier {

    private static final String PERSONAL_MESSAGE_PREFIX = "\u0019Ethereum Signed Message:\n";

    /**
     * Verify Ethereum signature from MetaMask
     *
     * @param address   The wallet address that signed the message
     * @param message   The original message that was signed
     * @param signature The hex signature from the wallet (0x prefixed)
     * @return true if signature is valid and matches the provided address
     */
    public boolean verifySignature(String address, String message, String signature) {
        try {
            // FIX 1: Use UTF-8 byte length for the prefix, not Java char length
            byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
            String prefix = PERSONAL_MESSAGE_PREFIX + messageBytes.length;
            byte[] prefixBytes = prefix.getBytes(StandardCharsets.UTF_8);

            // Concatenate prefix + message bytes manually to avoid double-encoding issues
            byte[] combined = new byte[prefixBytes.length + messageBytes.length];
            System.arraycopy(prefixBytes, 0, combined, 0, prefixBytes.length);
            System.arraycopy(messageBytes, 0, combined, prefixBytes.length, messageBytes.length);

            byte[] msgHash = Hash.sha3(combined);

            log.info("=== SIGNATURE VERIFICATION DEBUG ===");
            log.info("Address to verify: {}", address);
            log.info("Message: {}", message);
            log.info("Message UTF-8 byte length: {}", messageBytes.length);
            log.info("Prefix: {}", prefix);
            log.info("Message hash (hex): {}", Numeric.toHexString(msgHash));
            log.info("Signature: {}", signature);

            // Parse signature bytes
            byte[] signatureBytes = Numeric.hexStringToByteArray(signature);
            log.info("Signature bytes length: {}", signatureBytes.length);

            if (signatureBytes.length != 65) {
                log.error("Invalid signature length: {} (expected 65)", signatureBytes.length);
                return false;
            }

            byte[] r = Arrays.copyOfRange(signatureBytes, 0, 32);
            byte[] s = Arrays.copyOfRange(signatureBytes, 32, 64);
            byte v = signatureBytes[64];

            // Normalize v: some wallets send 0/1, others send 27/28
            if (v < 27) {
                v += 27;
            }
            log.info("Normalized v value: {}", v);

            // FIX 2: Use ECDSASignature (not SignatureData) for recoverFromSignature
            ECDSASignature ecdsaSig = new ECDSASignature(
                    new BigInteger(1, r),
                    new BigInteger(1, s)
            );

            // FIX 3: Correct recovery ID = v - 27 (gives 0 or 1)
            // Iterate all 4 possible recovery IDs for robustness
            for (int recoveryId = 0; recoveryId < 4; recoveryId++) {
                try {
                    BigInteger publicKey = Sign.recoverFromSignature(recoveryId, ecdsaSig, msgHash);

                    if (publicKey != null) {
                        String recoveredAddress = "0x" + Keys.getAddress(publicKey);
                        log.info("Recovery ID {}: recovered address = {}", recoveryId, recoveredAddress);

                        if (recoveredAddress.equalsIgnoreCase(address)) {
                            log.info("✅ Signature VALID. Matched at recovery ID {}", recoveryId);
                            log.info("=== END DEBUG ===");
                            return true;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Recovery ID {} failed: {}", recoveryId, e.getMessage());
                }
            }

            log.warn("❌ Signature INVALID. No recovery ID matched address: {}", address);
            log.info("=== END DEBUG ===");
            return false;

        } catch (Exception e) {
            log.error("Unexpected error verifying signature for address: {}", address, e);
            return false;
        }
    }
}