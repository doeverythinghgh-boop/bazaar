/**
 * @file workflowLogic.js
 * @description Workflow Logic Module.
 * Contains pure functions for verifying step sequences and calculating new states.
 * Adheres to SRP: Only handles rules of the workflow.
 */

/**
 * Validates if the requested step transition is allowed based on the current state.
 * @function validateStepSequence
 * @param {number} requestedStepNo - The number of the step trying to be activated.
 * @param {number} currentStepNo - The number of the currently active step.
 * @returns {object} Result object { isValid: boolean, errorMessage: string }.
 */
export function validateStepSequence(requestedStepNo, currentStepNo) {
    if (requestedStepNo <= currentStepNo) {
        return {
            isValid: false,
            errorMessage: "لا يمكن الرجوع إلى مرحلة سابقة. يجب التقدم بالترتيب فقط."
        };
    } else if (requestedStepNo !== currentStepNo + 1) {
        return {
            isValid: false,
            errorMessage: `يجب تفعيل المراحل بالترتيب. المرحلة التالية المتاحة هي رقم ${currentStepNo + 1}.`
        };
    }

    return { isValid: true, errorMessage: "" };
}

/**
 * Creates the state object to be saved.
 * @function createNewStepState
 * @param {object} step - The step object from control data.
 * @returns {object} The state object { stepId, stepNo, status }.
 */
export function createNewStepState(step) {
    return {
        stepId: step.id,
        stepNo: step.no,
        status: "active",
    };
}
