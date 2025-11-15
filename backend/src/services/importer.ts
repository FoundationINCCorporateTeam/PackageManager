import { RepoMetadata, RepoRelease, RepoAsset } from '../types';

const ALLOWED_HOSTS = (process.env.ALLOWED_IMPORT_HOSTS || 'github.com,gitlab.com,bitbucket.org')
  .split(',')
  .map((h) => h.trim());

export const validateImportUrl = (url: string, allowOverride = false): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // Prevent SSRF attacks
    if (!allowOverride && !ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
      throw new Error(`Host ${parsedUrl.hostname} is not allowed. Allowed hosts: ${ALLOWED_HOSTS.join(', ')}`);
    }

    // Block private IP ranges
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
    ) {
      throw new Error('Private IP addresses are not allowed');
    }

    return true;
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const importGitHubRepo = async (repoUrl: string, token?: string): Promise<RepoMetadata> => {
  validateImportUrl(repoUrl);

  // Parse GitHub URL (e.g., https://github.com/owner/repo)
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repoName] = match;
  const repo = repoName.replace(/\.git$/, '');

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Flo-Package-Registry',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // Fetch repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repository: ${repoResponse.status} ${repoResponse.statusText}`);
    }
    const repoData: any = await repoResponse.json();

    // Fetch README
    let readme = '';
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (readmeResponse.ok) {
        const readmeData: any = await readmeResponse.json();
        const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        readme = content;
      }
    } catch (error) {
      console.log('Could not fetch README:', error);
    }

    // Fetch releases
    const releases: RepoRelease[] = [];
    try {
      const releasesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers });
      if (releasesResponse.ok) {
        const releasesData: any = await releasesResponse.json();
        for (const release of releasesData.slice(0, 10)) { // Limit to 10 releases
          const assets: RepoAsset[] = release.assets.map((asset: any) => ({
            name: asset.name,
            url: asset.browser_download_url,
            size: asset.size,
            contentType: asset.content_type,
          }));

          releases.push({
            version: release.tag_name,
            notes: release.body,
            assets,
          });
        }
      }
    } catch (error) {
      console.log('Could not fetch releases:', error);
    }

    return {
      owner,
      name: repo,
      description: repoData.description,
      readme,
      homepage: repoData.homepage,
      releases,
    };
  } catch (error) {
    throw new Error(`Failed to import GitHub repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const importGitLabRepo = async (repoUrl: string, token?: string): Promise<RepoMetadata> => {
  validateImportUrl(repoUrl);

  // Parse GitLab URL
  const match = repoUrl.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitLab repository URL');
  }

  const [, owner, repoName] = match;
  const repo = repoName.replace(/\.git$/, '');
  const projectPath = encodeURIComponent(`${owner}/${repo}`);

  const headers: Record<string, string> = {
    'User-Agent': 'Flo-Package-Registry',
  };

  if (token) {
    headers['PRIVATE-TOKEN'] = token;
  }

  try {
    // Fetch project info
    const projectResponse = await fetch(`https://gitlab.com/api/v4/projects/${projectPath}`, { headers });
    if (!projectResponse.ok) {
      throw new Error(`Failed to fetch project: ${projectResponse.status}`);
    }
    const projectData: any = await projectResponse.json();

    // Fetch README
    let readme = '';
    try {
      const readmeResponse = await fetch(
        `https://gitlab.com/api/v4/projects/${projectPath}/repository/files/README.md/raw?ref=main`,
        { headers }
      );
      if (readmeResponse.ok) {
        readme = await readmeResponse.text();
      } else {
        // Try master branch
        const readmeResponse2 = await fetch(
          `https://gitlab.com/api/v4/projects/${projectPath}/repository/files/README.md/raw?ref=master`,
          { headers }
        );
        if (readmeResponse2.ok) {
          readme = await readmeResponse2.text();
        }
      }
    } catch (error) {
      console.log('Could not fetch README:', error);
    }

    return {
      owner,
      name: repo,
      description: projectData.description,
      readme,
      homepage: projectData.web_url,
      releases: [],
    };
  } catch (error) {
    throw new Error(`Failed to import GitLab repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const importRepository = async (repoUrl: string, token?: string): Promise<RepoMetadata> => {
  if (repoUrl.includes('github.com')) {
    return importGitHubRepo(repoUrl, token);
  } else if (repoUrl.includes('gitlab.com')) {
    return importGitLabRepo(repoUrl, token);
  } else {
    throw new Error('Unsupported repository platform. Only GitHub and GitLab are currently supported.');
  }
};
