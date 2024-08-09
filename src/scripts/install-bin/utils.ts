interface DownloadOptions {
  version: string;
  platform: string;
  arch: string;
}

function getNormalizedArch(arch: string): string {
  switch (arch) {
    case 'x64':
      return 'amd64';
    case 'ia32':
      return '386';
    case 'arm':
      return 'arm';
    case 'arm64':
      return 'arm64';
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
}

export function getDownloadBinUrl(options: DownloadOptions): string {
  return `https://cdn.teleport.dev/teleport-v${options.version}-${options.platform}-${getNormalizedArch(options.arch)}-bin.tar.gz`;
}

export function getDownloadChecksumUrl(options: DownloadOptions): string {
  return `https://cdn.teleport.dev/teleport-v${options.version}-${options.platform}-${getNormalizedArch(options.arch)}-bin.tar.gz.sha256`;
}

export function getDownloadDistributionLicenseUrl(): string {
  return 'https://github.com/gravitational/teleport/raw/master/LICENSE-community';
}
