/**
 * Restrict direct status changes in update payloads to manager roles.
 */
const ApiError = require('./apiError');
const { isManagerRole } = require('./leadApproval');

const assertManagerCanChangeStatus = (actor, currentStatus, nextStatus) => {
  if (nextStatus === undefined || nextStatus === currentStatus) return;
  if (!isManagerRole(actor?.roleName)) {
    throw ApiError.forbidden('Only a manager can change status from the edit form. Use the approval workflow.');
  }
};

module.exports = { assertManagerCanChangeStatus };
