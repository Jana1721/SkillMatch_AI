/**
 * SkillMatch AI — GitHub Repository & Project Link Verifier
 * Scans resume text for GitHub URLs, validates link formatting,
 * queries the official GitHub API to check repository availability,
 * and correlates repository code/language with candidate resume skills.
 */

/**
 * Extract GitHub URLs from raw text (both repo URLs and profile URLs)
 */
export function extractGitHubLinksFromText(text) {
  if (!text || typeof text !== 'string') {
    return { repoUrls: [], profileUrls: [] };
  }

  const repoUrls = new Set();
  const profileUrls = new Set();

  // Pattern for github.com/owner/repo (allowing optional http/https/www and cleaning trailing punctuation)
  const repoRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/gi;
  let match;
  while ((match = repoRegex.exec(text)) !== null) {
    const owner = match[1];
    let repo = match[2].replace(/[.,;:!?)'"\]}>]+$/, '').replace(/\.git$/i, '');
    if (owner && repo && !['features', 'topics', 'pricing', 'about', 'join', 'login', 'explore', 'orgs'].includes(owner.toLowerCase())) {
      repoUrls.add(`https://github.com/${owner}/${repo}`);
    }
  }

  // Pattern for github.com/username profiles
  const profileRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/)?(?=[\s,;!?"'\])}>]|$)/gi;
  while ((match = profileRegex.exec(text)) !== null) {
    const username = match[1];
    if (
      username &&
      !['features', 'topics', 'pricing', 'about', 'join', 'login', 'explore', 'orgs'].includes(username.toLowerCase()) &&
      !Array.from(repoUrls).some(u => u.includes(`/${username}/`))
    ) {
      profileUrls.add(`https://github.com/${username}`);
    }
  }

  return {
    repoUrls: Array.from(repoUrls),
    profileUrls: Array.from(profileUrls)
  };
}

/**
 * Verify a single GitHub repository URL via the official GitHub REST API
 */
export async function verifySingleGitHubRepo(inputUrl, candidateSkills = []) {
  const cleanUrl = (inputUrl || '').trim();
  if (!cleanUrl) {
    return {
      url: cleanUrl,
      isValid: false,
      isAvailable: false,
      status: 'Invalid URL',
      message: 'No GitHub URL provided.'
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
  } catch (e) {
    return {
      url: cleanUrl,
      isValid: false,
      isAvailable: false,
      status: 'Invalid Format',
      message: 'Provided string is not a valid URL format.'
    };
  }

  if (!['github.com', 'www.github.com'].includes(parsedUrl.hostname.toLowerCase())) {
    return {
      url: cleanUrl,
      isValid: false,
      isAvailable: false,
      status: 'Not GitHub',
      message: 'Only official github.com URLs can be verified.'
    };
  }

  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    // Single part is a profile, not a repository
    return {
      url: cleanUrl,
      owner: parts[0] || '',
      repo: '',
      isProfile: true,
      isValid: true,
      isAvailable: true,
      status: 'Profile Link',
      message: 'This is a candidate GitHub profile link, not a specific repository.'
    };
  }

  const owner = parts[0];
  const repo = parts[1].replace(/[.,;:!?)'"\]}>]+$/, '').replace(/\.git$/i, '');
  const canonicalUrl = `https://github.com/${owner}/${repo}`;

  const headers = {
    'User-Agent': 'SkillMatchAI-CareerVerifier/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

    if (apiRes.status === 404) {
      return {
        url: canonicalUrl,
        owner,
        repo,
        isValid: true,
        isAvailable: false,
        status: 'Repository Not Found',
        badgeColor: 'rose',
        message: 'The repository could not be found on GitHub (404). Link may be broken or the repository is deleted.'
      };
    }

    if (apiRes.status === 403) {
      return {
        url: canonicalUrl,
        owner,
        repo,
        isValid: true,
        isAvailable: false,
        status: 'Private or Inaccessible',
        badgeColor: 'amber',
        message: 'Repository exists but is private or requires authorization (403).'
      };
    }

    if (!apiRes.ok) {
      return {
        url: canonicalUrl,
        owner,
        repo,
        isValid: true,
        isAvailable: false,
        status: 'Verification Inconclusive',
        badgeColor: 'amber',
        message: `GitHub returned HTTP status ${apiRes.status}.`
      };
    }

    const repoData = await apiRes.json();

    // Check README availability
    let hasReadme = false;
    let readmeSnippet = '';
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (readmeRes.ok) {
        hasReadme = true;
        const readmeJson = await readmeRes.json();
        if (readmeJson.content) {
          readmeSnippet = Buffer.from(readmeJson.content, 'base64').toString('utf8').slice(0, 800);
        }
      }
    } catch (e) {
      // README check optional
    }

    // Correlate repo language & topics with resume skills
    const repoKeywords = [
      repoData.language,
      ...(repoData.topics || []),
      repoData.name,
      repoData.description,
      readmeSnippet
    ].filter(Boolean).join(' ').toLowerCase();

    const matchedSkills = candidateSkills.filter(skill =>
      skill && repoKeywords.includes(skill.toLowerCase())
    );

    return {
      url: canonicalUrl,
      owner,
      repo,
      isValid: true,
      isAvailable: true,
      status: 'Verified & Available',
      badgeColor: 'emerald',
      repoDetails: {
        fullName: repoData.full_name || `${owner}/${repo}`,
        description: repoData.description || 'No description provided in repository metadata.',
        language: repoData.language || 'Software Code',
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        openIssues: repoData.open_issues_count || 0,
        topics: repoData.topics || [],
        isPrivate: repoData.private || false,
        hasReadme,
        readmeSnippet,
        lastUpdated: repoData.updated_at || new Date().toISOString(),
        htmlUrl: repoData.html_url || canonicalUrl
      },
      skillsMatched: matchedSkills,
      verificationEvidence: `Public GitHub repository is live. Primary language: ${repoData.language || 'Code'}. ${hasReadme ? 'Contains documentation (README.md).' : 'Documentation pending.'} Matched skills: ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'Software Engineering'}.`
    };
  } catch (err) {
    return {
      url: canonicalUrl,
      owner,
      repo,
      isValid: true,
      isAvailable: false,
      status: 'Network Error',
      badgeColor: 'amber',
      message: `Could not connect to GitHub API: ${err.message}`
    };
  }
}

/**
 * Scan resume text and verify all embedded GitHub repositories
 */
export async function verifyResumeGitHubLinks(resumeText, candidateSkills = []) {
  const { repoUrls, profileUrls } = extractGitHubLinksFromText(resumeText);
  const verifiedRepos = [];

  for (const url of repoUrls.slice(0, 5)) {
    const verification = await verifySingleGitHubRepo(url, candidateSkills);
    verifiedRepos.push(verification);
  }

  const hasRepos = verifiedRepos.length > 0;
  const availableCount = verifiedRepos.filter(r => r.isAvailable).length;

  return {
    detected: hasRepos || profileUrls.length > 0,
    hasRepos,
    repoCount: verifiedRepos.length,
    availableCount,
    repositories: verifiedRepos,
    profileUrls,
    summary: hasRepos
      ? availableCount > 0
        ? `${availableCount} of ${verifiedRepos.length} GitHub repository link(s) verified and available online.`
        : `Detected ${verifiedRepos.length} repository link(s), but repository is currently not publicly accessible or not found.`
      : profileUrls.length > 0
      ? `Candidate GitHub profile link detected: ${profileUrls[0]}`
      : 'No GitHub repository links detected in resume text.'
  };
}
