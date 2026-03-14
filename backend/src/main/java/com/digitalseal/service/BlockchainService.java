package com.digitalseal.service;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.DynamicArray;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BlockchainService {

    public record BatchMintResult(String txHash, BigInteger blockNumber, BigInteger startTokenId) {}
    public record VerifyResult(
        boolean exists, String serial, String brand, String currentOwner,
        boolean isSold, boolean isClaimed, long mintedAt, String metadataURI
    ) {}
    private final Web3j web3j;

    private final Credentials credentials;

    private final ContractGasProvider gasProvider;

    @Value("${web3.contract.address:}")
    private String contractAddress;

    @Value("${web3.rpc.url:}")
    private String rpcUrl;

    private boolean blockchainAvailable = false;

    public BlockchainService(Web3j web3j, Credentials credentials, ContractGasProvider gasProvider) {
        this.web3j = web3j;
        this.credentials = credentials;
        this.gasProvider = gasProvider;
    }

    // ========== BATCH PRE-MINT ==========

    @PostConstruct
    public void init() {
        try {
            if (contractAddress != null && !contractAddress.isBlank()) {
                web3j.web3ClientVersion().send();
                blockchainAvailable = true;
                log.info("Blockchain service initialized. Contract: {}", contractAddress);
            } else {
                log.warn("No contract address configured. Blockchain features disabled.");
            }
        } catch (Exception e) {
            log.warn("Blockchain node not available: {}. Blockchain features disabled.", e.getMessage());
        }
    }

    // ========== PURCHASE ITEM ==========

    /**
     * Not called from backend directly — buyer calls purchaseItem on-chain via their wallet (MetaMask).
     * This is handled client-side. Backend only records the tx hash.
     */

    // ========== TRANSFER TOKEN ==========

    public boolean isAvailable() {
        return blockchainAvailable;
    }

    // ========== VERIFY ==========

    /**
     * Batch pre-mint NFTs on the blockchain.
     * 
     * @param brandWallet  The brand's wallet address
     * @param serials      Array of item serial strings
     * @param metadataURIs Array of metadata URIs
     * @param priceWei     Price per item in wei
     * @return BatchMintResult containing txHash and startTokenId
     */
    public BatchMintResult batchPreMint(String brandWallet, List<String> serials, List<String> metadataURIs, BigInteger priceWei) {
        if (!blockchainAvailable) {
            log.warn("Blockchain not available. Skipping batch premint.");
            return null;
        }

        try {
            log.info("Batch pre-minting {} items for brand wallet: {}", serials.size(), brandWallet);

            // Contract function: batchMintDigitalTwins(address[] recipients, string[] serialNumbers, string[] ipfsUris)
            // Mint to the platform wallet (credentials address) so the platform can transfer on claim.
            String platformWallet = credentials.getAddress();
            log.info("Minting {} items to platform wallet: {}", serials.size(), platformWallet);
            List<Address> recipientAddresses = serials.stream()
                    .map(s -> new Address(platformWallet))
                    .toList();

            List<Type> inputParameters = Arrays.asList(
                new DynamicArray<>(Address.class, recipientAddresses),
                new DynamicArray<>(Utf8String.class, serials.stream().map(Utf8String::new).toList()),
                new DynamicArray<>(Utf8String.class, metadataURIs.stream().map(Utf8String::new).toList())
            );

            List<TypeReference<?>> outputParameters = Collections.singletonList(
                new TypeReference<DynamicArray<Uint256>>() {}
            );

            Function function = new Function("batchMintDigitalTwins", inputParameters, outputParameters);
            String encodedFunction = FunctionEncoder.encode(function);

            // Capture current totalSupply before minting to compute startTokenId
            // Tokens start from 1, so first new token = totalSupply + 1
            BigInteger totalSupplyBefore = getTotalSupply();
            log.info("totalSupply before mint: {}", totalSupplyBefore);

            TransactionManager txManager = new RawTransactionManager(web3j, credentials, 31337L);

            EthSendTransaction txResponse = txManager.sendTransaction(
                gasProvider.getGasPrice("batchMintDigitalTwins"),
                BigInteger.valueOf(5_000_000), // gas limit for batch mint
                contractAddress,
                encodedFunction,
                BigInteger.ZERO
            );

            if (txResponse.hasError()) {
                log.error("Batch premint tx failed: {}", txResponse.getError().getMessage());
                throw new RuntimeException("Blockchain transaction failed: " + txResponse.getError().getMessage());
            }

            String txHash = txResponse.getTransactionHash();
            log.info("Batch premint tx sent: {}", txHash);

            // Wait for receipt
            EthGetTransactionReceipt receiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
            TransactionReceipt receipt = receiptResponse.getTransactionReceipt().orElse(null);

            // Poll for receipt if not immediately available
            int attempts = 0;
            while (receipt == null && attempts < 30) {
                Thread.sleep(1000);
                receiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
                receipt = receiptResponse.getTransactionReceipt().orElse(null);
                attempts++;
            }

            if (receipt == null) {
                log.warn("Transaction receipt not available after 30s. TxHash: {}", txHash);
                return new BatchMintResult(txHash, null, null);
            }

            if (!receipt.isStatusOK()) {
                log.error("Batch premint tx reverted. TxHash: {}", txHash);
                throw new RuntimeException("Transaction reverted on blockchain");
            }

            BigInteger blockNumber = receipt.getBlockNumber();

            // Compute startTokenId: tokens started at 1, so first minted = totalSupplyBefore + 1
            BigInteger startTokenId = totalSupplyBefore.add(BigInteger.ONE);

            log.info("Batch premint successful. TxHash: {}, Block: {}, StartTokenId: {}", 
                txHash, blockNumber, startTokenId);

            return new BatchMintResult(txHash, blockNumber, startTokenId);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted during blockchain operation", e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Blockchain batchPreMint error: {}", e.getMessage(), e);
            throw new RuntimeException("Blockchain operation failed", e);
        }
    }

    // ========== AUTHORIZE BRAND ==========

    /**
     * Transfer an NFT from the platform wallet to a recipient (purchase or claim).
     * @param context  Human-readable reason, e.g. "PURCHASE" or "CLAIM".
     */
    public String transferToken(Long tokenId, String toWallet, String context) {
        if (!blockchainAvailable) {
            log.warn("Blockchain not available. Skipping token transfer.");
            return null;
        }

        try {
            log.info("Transferring tokenId={} to {} (context: {})", tokenId, toWallet, context);

            String fromWallet = credentials.getAddress();
            List<Type> inputParameters = Arrays.asList(
                new Address(fromWallet),
                new Address(toWallet),
                new Uint256(BigInteger.valueOf(tokenId))
            );

            Function function = new Function("secureTransfer", inputParameters, Collections.emptyList());
            String encodedFunction = FunctionEncoder.encode(function);

            TransactionManager txManager = new RawTransactionManager(web3j, credentials, 31337L);

            EthSendTransaction txResponse = txManager.sendTransaction(
                gasProvider.getGasPrice("secureTransfer"),
                BigInteger.valueOf(1_000_000),
                contractAddress,
                encodedFunction,
                BigInteger.ZERO
            );

            if (txResponse.hasError()) {
                throw new RuntimeException("Transfer failed: " + txResponse.getError().getMessage());
            }

            String txHash = txResponse.getTransactionHash();
            log.info("Token transfer tx sent: {}", txHash);

            waitForReceipt(txHash);

            return txHash;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Blockchain transferToken error: {}", e.getMessage(), e);
            throw new RuntimeException("Blockchain operation failed", e);
        }
    }

    // ========== HELPERS ==========

    /**
     * Verify a token on-chain (read-only call).
     */
    public VerifyResult verify(Long tokenId) {
        if (!blockchainAvailable) {
            return null;
        }

        try {
            List<Type> inputParameters = Collections.singletonList(
                new Uint256(BigInteger.valueOf(tokenId))
            );

            List<TypeReference<?>> outputParameters = Arrays.asList(
                new TypeReference<Bool>() {},
                new TypeReference<Utf8String>() {},
                new TypeReference<Address>() {},
                new TypeReference<Address>() {},
                new TypeReference<Bool>() {},
                new TypeReference<Bool>() {},
                new TypeReference<Uint256>() {},
                new TypeReference<Utf8String>() {}
            );

            Function function = new Function("verify", inputParameters, outputParameters);
            String encodedFunction = FunctionEncoder.encode(function);

            EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(
                    credentials.getAddress(),
                    contractAddress,
                    encodedFunction
                ),
                DefaultBlockParameterName.LATEST
            ).send();

            List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());

            if (results.isEmpty()) {
                return null;
            }

            boolean exists = (Boolean) results.get(0).getValue();
            String serial = (String) results.get(1).getValue();
            String brand = (String) results.get(2).getValue();
            String currentOwner = (String) results.get(3).getValue();
            boolean isSold = (Boolean) results.get(4).getValue();
            boolean isClaimed = (Boolean) results.get(5).getValue();
            BigInteger mintedAt = (BigInteger) results.get(6).getValue();
            String metadataURI = (String) results.get(7).getValue();

            return new VerifyResult(exists, serial, brand, currentOwner, isSold, isClaimed, mintedAt.longValue(), metadataURI);

        } catch (Exception e) {
            log.error("Blockchain verify error: {}", e.getMessage(), e);
            return null;
        }
    }

    public String authorizeBrand(String brandWallet, boolean authorized) {
        if (!blockchainAvailable) {
            return null;
        }

        try {
            List<Type> inputParameters = Arrays.asList(
                new Address(brandWallet),
                new Bool(authorized)
            );

            Function function = new Function("authorizeBrand", inputParameters, Collections.emptyList());
            String encodedFunction = FunctionEncoder.encode(function);

            TransactionManager txManager = new RawTransactionManager(web3j, credentials, 31337L);

            EthSendTransaction txResponse = txManager.sendTransaction(
                gasProvider.getGasPrice("authorizeBrand"),
                BigInteger.valueOf(100_000),
                contractAddress,
                encodedFunction,
                BigInteger.ZERO
            );

            if (txResponse.hasError()) {
                throw new RuntimeException("authorizeBrand failed: " + txResponse.getError().getMessage());
            }

            String txHash = txResponse.getTransactionHash();
            waitForReceipt(txHash);
            log.info("Brand {} authorized={} tx: {}", brandWallet, authorized, txHash);
            return txHash;

        } catch (Exception e) {
            log.error("Blockchain authorizeBrand error: {}", e.getMessage(), e);
            throw new RuntimeException("Blockchain operation failed", e);
        }
    }

    // ========== RESULT RECORDS ==========

    private BigInteger getTotalSupply() throws Exception {
        Function function = new Function("totalSupply", Collections.emptyList(),
            Collections.singletonList(new TypeReference<Uint256>() {}));

        String encoded = FunctionEncoder.encode(function);

        EthCall response = web3j.ethCall(
            Transaction.createEthCallTransaction(credentials.getAddress(), contractAddress, encoded),
            DefaultBlockParameterName.LATEST
        ).send();

        List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        return (BigInteger) results.get(0).getValue();
    }

    private TransactionReceipt waitForReceipt(String txHash) throws Exception {
        int attempts = 0;
        while (attempts < 30) {
            EthGetTransactionReceipt receiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
            if (receiptResponse.getTransactionReceipt().isPresent()) {
                TransactionReceipt receipt = receiptResponse.getTransactionReceipt().get();
                if (!receipt.isStatusOK()) {
                    throw new RuntimeException("Transaction reverted. TxHash: " + txHash);
                }
                return receipt;
            }
            Thread.sleep(1000);
            attempts++;
        }
        log.warn("Receipt not available after 30s for tx: {}", txHash);
        return null;
    }
}
