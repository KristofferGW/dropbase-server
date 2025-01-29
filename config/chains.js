const { EvmChain } = require("@moralisweb3/common-evm-utils");

const CHAINS = [
    { chain: EvmChain.ETHEREUM, name: 'Ethereum' },
    { chain: EvmChain.BSC, name: 'BSC' },
    { chain: EvmChain.ARBITRUM, name: 'Arbitrum' },
    { chain: EvmChain.BASE, name: 'Base' },
    { chain: EvmChain.OPTIMISM, name: 'Optimism' },
    { chain: EvmChain.LINEA, name: 'Linea' },
    { chain: EvmChain.AVALANCHE, name: 'Avalanche' },
    { chain: EvmChain.BLAST, name: 'Blast' },
    { chain: EvmChain.ZKSYNC, name: 'zkSync' },
    { chain: EvmChain.MANTLE, name: 'Mantle' },
    { chain: EvmChain.POLYGON_ZKEVM, name: 'Polygon zkEVM' }
];

module.exports = CHAINS;