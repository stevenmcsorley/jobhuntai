const knex = require('../db/knex');

/**
 * CV Versioning Service
 * Manages CV versions for accurate job matching audit trails
 */

/**
 * Create a new CV version
 * @param {number} userId - User ID
 * @param {string} content - CV content
 * @param {string} source - Source of the change ('editor', 'master_profile', 'upload')
 * @param {string} changeSummary - Summary of what changed
 * @returns {Promise<Object>} New CV version
 */
async function createCvVersion(userId, content, source = 'editor', changeSummary = '') {
  return await knex.transaction(async (trx) => {
    // Get current version number
    const currentCv = await trx('cvs')
      .where({ user_id: userId, is_current: true })
      .first();

    const nextVersion = currentCv ? currentCv.version + 1 : 1;

    // Mark current CV as not current
    if (currentCv) {
      await trx('cvs')
        .where({ user_id: userId, is_current: true })
        .update({ is_current: false });
    }

    // Create new CV version
    const [newCv] = await trx('cvs')
      .insert({
        user_id: userId,
        content,
        version: nextVersion,
        is_current: true,
        source,
        change_summary: changeSummary
      })
      .returning('*');

    console.log(`✅ Created CV version ${nextVersion} for user ${userId} (source: ${source})`);
    return newCv;
  });
}

/**
 * Get current CV for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Current CV
 */
async function getCurrentCv(userId) {
  return await knex('cvs')
    .where({ user_id: userId, is_current: true })
    .first();
}

/**
 * Get CV version history for a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of versions to return (default: 10)
 * @returns {Promise<Array>} CV version history
 */
async function getCvHistory(userId, limit = 10) {
  return await knex('cvs')
    .where({ user_id: userId })
    .orderBy('version', 'desc')
    .limit(limit)
    .select('id', 'version', 'source', 'change_summary', 'created_at', 'is_current');
}

/**
 * Get specific CV version
 * @param {number} userId - User ID
 * @param {number} version - Version number
 * @returns {Promise<Object|null>} CV version
 */
async function getCvVersion(userId, version) {
  return await knex('cvs')
    .where({ user_id: userId, version })
    .first();
}

/**
 * Update CV with versioning
 * @param {number} userId - User ID
 * @param {string} content - New CV content
 * @param {string} source - Source of the change
 * @param {string} changeSummary - Summary of changes
 * @returns {Promise<Object>} New CV version
 */
async function updateCvWithVersion(userId, content, source, changeSummary) {
  const currentCv = await getCurrentCv(userId);
  
  // Only create new version if content actually changed
  if (!currentCv || currentCv.content !== content) {
    return await createCvVersion(userId, content, source, changeSummary);
  }
  
  return currentCv;
}

/**
 * Get CV content for matching (used by matcher service)
 * @param {number} userId - User ID
 * @returns {Promise<{content: string, version: number, cvId: number}>} CV data for matching
 */
async function getCvForMatching(userId) {
  const currentCv = await getCurrentCv(userId);
  
  if (!currentCv) {
    return { content: '', version: 0, cvId: null };
  }
  
  return {
    content: currentCv.content,
    version: currentCv.version,
    cvId: currentCv.id
  };
}

/**
 * Store CV version info in match result
 * @param {Object} trx - Knex transaction
 * @param {number} matchId - Match ID
 * @param {number} cvVersion - CV version used
 * @param {string} cvContent - CV content snapshot
 */
async function storeCvInfoInMatch(trx, matchId, cvVersion, cvContent) {
  await trx('matches')
    .where({ id: matchId })
    .update({
      cv_version: cvVersion,
      cv_content_snapshot: cvContent
    });
}

module.exports = {
  createCvVersion,
  getCurrentCv,
  getCvHistory,
  getCvVersion,
  updateCvWithVersion,
  getCvForMatching,
  storeCvInfoInMatch
};