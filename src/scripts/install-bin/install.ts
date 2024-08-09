import { extract } from 'tar';
import { arch, platform } from 'node:os';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import {
  getDownloadBinUrl,
  getDownloadChecksumUrl,
  getDownloadDistributionLicenseUrl,
} from './utils';

const TELEPORT_VERSION = '16.1.4';
const TELEPORT_PLATFORM = platform();
const TELEPORT_ARCH = arch();
const TELEPORT_BIN_DIR = resolve(__dirname, '../../bin');
const TELEPORT_BIN_CLIS = ['tctl', 'tsh'];
const TELEPORT_DIST_LICENSE = resolve(TELEPORT_BIN_DIR, 'LICENSE-community');

export async function main(): Promise<void> {
  const [binRes, sumRes, licenseRes] = await Promise.all([
    fetch(
      getDownloadBinUrl({
        version: TELEPORT_VERSION,
        platform: TELEPORT_PLATFORM,
        arch: TELEPORT_ARCH,
      }),
    ),
    fetch(
      getDownloadChecksumUrl({
        version: TELEPORT_VERSION,
        platform: TELEPORT_PLATFORM,
        arch: TELEPORT_ARCH,
      }),
    ),
    fetch(getDownloadDistributionLicenseUrl()),
  ]);

  if (!binRes.body || !sumRes.body) {
    throw new Error('Failed to download binaries');
  }

  const sha256SumRes = (await sumRes.text()).split('  ')[0].trim();
  const hasher = createHash('sha256');

  const chunks: Uint8Array[] = [];

  for await (const chunk of binRes.body) {
    hasher.update(chunk);
    chunks.push(chunk);
  }

  const sha256SumBin = hasher.digest('hex');

  if (sha256SumBin !== sha256SumRes) {
    throw new Error(`Checksum mismatch, ${sha256SumBin} !== ${sha256SumRes}`);
  }

  const x = extract({
    strip: 1,
    cwd: TELEPORT_BIN_DIR,
    gzip: true,
    filter: (path) => {
      const name = path.split('/').pop();
      if (!name) return false;
      return TELEPORT_BIN_CLIS.includes(name);
    },
  });

  x.write(new Uint8Array(Buffer.concat(chunks)));

  writeFileSync(TELEPORT_DIST_LICENSE, await licenseRes.text(), {
    encoding: 'utf-8',
  });
}
