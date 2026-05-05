'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button, cn, Select } from '@todo/ui-web';
import { BlockchainNetwork } from '@todo/services';

const walletConnectVariants = cva('bg-base-100 rounded-lg border border-base-300 shadow-sm', {
  variants: {
    variant: {
      default: 'p-4',
      compact: 'p-3',
      'button-only': 'border-0 bg-transparent p-0 shadow-none',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface WalletAccount {
  address: string;
  network: BlockchainNetwork;
  balance?: string;
}

export interface WalletConnectProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof walletConnectVariants> {
  isConnected?: boolean;
  isConnecting?: boolean;
  account?: WalletAccount | null;
  onConnect: () => void;
  onDisconnect?: () => void;
  onNetworkSwitch?: (network: BlockchainNetwork) => void;
  showBalance?: boolean;
  showNetworkSelector?: boolean;
  supportedNetworks?: BlockchainNetwork[];
}

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletConnect = React.forwardRef<HTMLDivElement, WalletConnectProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isConnected = false,
      isConnecting = false,
      account = null,
      onConnect,
      onDisconnect,
      onNetworkSwitch,
      showBalance = true,
      showNetworkSelector = false,
      supportedNetworks = [BlockchainNetwork.POLYGON, BlockchainNetwork.SOLANA],
      ...props
    },
    ref,
  ) => {
    if (variant === 'button-only' && !isConnected) {
      return (
        <div ref={ref} className={cn(walletConnectVariants({ variant, size, className }))} {...props}>
          <Button onClick={onConnect} disabled={isConnecting} aria-label="Connect to wallet">
            Connect Wallet
          </Button>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(walletConnectVariants({ variant, size, className }))} {...props}>
        {isConnected && account ? (
          <div className="space-y-3">
            <div className="font-medium">Wallet Connected</div>
            <div className="text-sm text-base-content/70">{formatAddress(account.address)}</div>
            {showBalance && account.balance ? (
              <div className="text-sm">
                Balance: <span>{account.balance}</span>
              </div>
            ) : null}
            {showNetworkSelector ? (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="wallet-network">
                  Network:
                </label>
                <Select
                  id="wallet-network"
                  value={account.network}
                  onChange={event => onNetworkSwitch?.(event.target.value as BlockchainNetwork)}
                >
                  {supportedNetworks.map(network => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {onDisconnect ? (
              <Button variant="outline" onClick={onDisconnect} disabled={isConnecting}>
                Disconnect
              </Button>
            ) : null}
          </div>
        ) : (
          <Button onClick={onConnect} disabled={isConnecting} aria-label="Connect to wallet">
            Connect Wallet
          </Button>
        )}
      </div>
    );
  },
);

WalletConnect.displayName = 'WalletConnect';

export { WalletConnect, walletConnectVariants };
