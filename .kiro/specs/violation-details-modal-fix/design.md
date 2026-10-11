# Violation Details Modal Temporal Dead Zone Bugfix Design

## Overview

This document formalizes the fix for a JavaScript temporal dead zone error in `violation.js` that prevents the Violation Details Modal from displaying when a student has exactly one sanction. The bug occurs because the variable `isUserAdmin` is referenced at line 4500 before it's declared at line 4748, violating JavaScript's lexical scoping rules for `let` declarations.

**Fix Strategy:** Move the `isUserAdmin` declaration and initialization to occur before the sanction section logic (before line 4489) so it's available for all code paths. This is a minimal, surgical fix that eliminates the temporal dead zone without changing any other behavior.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a student has exactly one sanction (not zero, not multiple)
- **Property (P)**: The desired behavior when the bug condition holds - modal displays successfully with correct admin role evaluation
- **Preservation**: All other modal functionality and multi-sanction/zero-sanction cases that currently work correctly
- **Temporal Dead Zone (TDZ)**: The period between entering a scope and the variable declaration where accessing the variable causes a ReferenceError
- **isUserAdmin**: A boolean variable that determines whether to show admin-only UI elements (Resolve button)
- **allStudentViolations**: Array of sanction records associated with the student in the violation being viewed
- **sanctionSection**: DOM element that displays sanction information in the modal

## Bug Details

### Bug Condition

The bug manifests when a user attempts to view violation details for a student with exactly one sanction. The code path enters the single-sanction branch at line 4493 and attempts to reference `isUserAdmin` at line 4500 before it has been declared at line 4748, causing a ReferenceError that halts modal initialization.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ModalOpenEvent
  OUTPUT: boolean
  
  RETURN input.allStudentViolations.length == 1
         AND input.codeReachesLine4500 == true
         AND input.isUserAdminDeclaredYet == false
END FUNCTION
```

### Examples

- **Sanction Count = 1**: User clicks "View Details" → Code enters `if (allStudentViolations.length === 1)` branch at line 4493 → References `isUserAdmin` at line 4500 → **ReferenceError: Cannot access 'isUserAdmin' before initialization** → Modal fails to display

- **Sanction Count = 3**: User clicks "View Details" → Code enters `else` branch at line 4514 → Declares local `isUserAdmin` at line 4516 before using it → Modal displays successfully

- **Sanction Count = 0**: User clicks "View Details" → `sanctionSection.style.display = 'none'` at line 4571 → Code never enters either branch → Modal displays successfully without sanction section

- **Edge case - Sanction Count = 1, Admin User**: User clicks "View Details" → Same ReferenceError occurs regardless of actual user role → Modal still fails to display (the bug prevents role checking from happening at all)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Multi-sanction display (length > 1) must continue to work with sequential resolution logic
- Zero-sanction display (length == 0) must continue to hide the sanction section
- All other modal sections (student info, violation types, levels, dates, locations, reported by, status) must render identically
- RBAC button visibility logic must continue to work for Edit, Print Slip buttons
- Modal close functionality must continue to work correctly
- All event listeners and handlers must remain unchanged

**Scope:**
All inputs where `allStudentViolations.length !== 1` should be completely unaffected by this fix. This includes:
- Cases with zero sanctions (sanction section hidden)
- Cases with multiple sanctions (uses local `isUserAdmin` declaration in else branch)
- All non-sanction-related modal functionality (student info display, violation history, action buttons, close behavior)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is **variable hoisting behavior with `let` declarations**:

1. **JavaScript Temporal Dead Zone (TDZ)**: The `let isUserAdmin` declaration at line 4748 creates a binding that exists throughout the entire function scope, but accessing it before line 4748 throws a ReferenceError due to TDZ rules.

2. **Conditional Code Path Oversight**: The multi-sanction branch (line 4514) correctly declares its own local `isUserAdmin` before use, but the single-sanction branch (line 4493) assumed it could reference the function-scoped `isUserAdmin` declared later at line 4748.

3. **Why Multi-Sanction Works**: The `else` block at line 4514 declares a new local `isUserAdmin` with `let`, which shadows the outer declaration and is available immediately within that block scope.

4. **Why Zero-Sanction Works**: The code never enters the sanction rendering logic when `allStudentViolations.length === 0`, so the reference to `isUserAdmin` at line 4500 is never executed.

## Correctness Properties

Property 1: Bug Condition - Single Sanction Modal Display

_For any_ modal open event where exactly one sanction exists for the student, the fixed code SHALL successfully initialize and display the ViolationDetailsModal without throwing a ReferenceError, correctly evaluating the user's admin role status to determine Resolve button visibility.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Multi-Sanction and Zero-Sanction Behavior

_For any_ modal open event where the student has zero sanctions OR multiple sanctions, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing modal display logic, button visibility rules, and sequential resolution checking.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

The fix is a minimal code relocation that eliminates the temporal dead zone without altering any logic.

**File**: `app/assets/js/violation.js`

**Function**: `showViolationDetailsModal` (or the modal initialization function containing lines 4489-4748)

**Specific Changes**:

1. **Relocate RBAC Check Block**: Move the `isUserAdmin` declaration and role-checking logic from line 4748 to **before** the sanction section logic (ideally right before line 4489 where `if (allStudentViolations.length > 0)` begins).

   **Code to Move** (currently at lines 4748-4765):
   ```javascript
   // RBAC: Check for admin role
   let isUserAdmin = false;
   const sessionStr = localStorage.getItem('userSession');
   const cookieRoleMatch = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('role='));
   let currentRole = '';
   
   if (sessionStr) {
       try {
           const session = JSON.parse(sessionStr);
           currentRole = session.role || '';
       } catch (e) {}
   }
   
   if (!currentRole && cookieRoleMatch) {
       currentRole = decodeURIComponent(cookieRoleMatch.split('=')[1]);
   }
   
   isUserAdmin = (currentRole.toLowerCase() === 'admin');
   ```

   **New Location**: Insert this block before line 4489 (before the `if (allStudentViolations.length > 0)` check).

2. **Remove Duplicate Local Declaration**: Delete the local `let isUserAdmin = false;` declaration at line 4516 in the multi-sanction `else` block, since the outer scope declaration will now be available.

   **Current Code at Line 4516** (to be removed):
   ```javascript
   let isUserAdmin = false;
   ```

   The multi-sanction branch should now use the outer `isUserAdmin` variable declared earlier.

3. **Verify Variable Scope**: Ensure the relocated `isUserAdmin` is declared with `let` (not `const`) at the appropriate function scope level so it's accessible to both sanction branches and the RBAC button visibility logic below.

4. **No Logic Changes**: The role-checking logic itself (sessionStorage parsing, cookie fallback, lowercase comparison) remains completely unchanged. Only the location changes.

5. **Preserve RBAC Button Visibility Logic**: The code after the original line 4765 that uses `isUserAdmin` to show/hide Edit and other buttons will continue to work unchanged since the variable will already be declared and initialized.

### Code Relocation Visual

**Before** (Buggy):
```
Line 4489: if (allStudentViolations.length > 0) {
Line 4493:     if (allStudentViolations.length === 1) {
Line 4500:         const resolveBtn = !isResolved && isUserAdmin  // ❌ TDZ ERROR
...
Line 4514:     } else {
Line 4516:         let isUserAdmin = false;  // ✅ Local declaration
...
Line 4571: } else { sanctionSection.style.display = 'none'; }
...
Line 4748: let isUserAdmin = false;  // ✅ Outer declaration (too late!)
```

**After** (Fixed):
```
Line 4488: // RBAC: Check for admin role
Line 4489: let isUserAdmin = false;
...  (role checking logic)
Line 4505: isUserAdmin = (currentRole.toLowerCase() === 'admin');
Line 4507: if (allStudentViolations.length > 0) {
Line 4511:     if (allStudentViolations.length === 1) {
Line 4518:         const resolveBtn = !isResolved && isUserAdmin  // ✅ Variable declared
...
Line 4532:     } else {
Line 4533:         // Removed: let isUserAdmin = false;  // No longer needed
...
```

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code to confirm the root cause; second, verify the fix eliminates the error for single-sanction cases; third, verify preservation of all existing behavior for other cases.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the temporal dead zone hypothesis by observing the ReferenceError in the console.

**Test Plan**: Open the browser console, navigate to the violations page, and attempt to view details for violations with different sanction counts. Observe the error message and stack trace for single-sanction cases on UNFIXED code.

**Test Cases**:
1. **Single Sanction - Admin User**: Click "View Details" for a violation with 1 sanction while logged in as admin (will fail on unfixed code with ReferenceError)
2. **Single Sanction - Non-Admin User**: Click "View Details" for a violation with 1 sanction while logged in as non-admin (will fail on unfixed code with same ReferenceError)
3. **Single Sanction - Resolved Status**: Click "View Details" for a violation with 1 resolved sanction (will fail on unfixed code before status can be checked)
4. **Single Sanction - Unresolved Status**: Click "View Details" for a violation with 1 unresolved sanction (will fail on unfixed code before status can be checked)

**Expected Counterexamples**:
- Browser console shows: `Uncaught ReferenceError: Cannot access 'isUserAdmin' before initialization`
- Stack trace points to line 4500 in `violation.js`
- Modal element does not receive 'active' class
- Modal remains hidden despite "Opening details modal" log appearing
- Possible causes confirmed: temporal dead zone due to premature variable access

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (single sanction), the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL violationView WHERE violationView.sanctionCount == 1 DO
  result := showViolationDetailsModal_fixed(violationView)
  ASSERT result.modalDisplayed == true
  ASSERT result.errorThrown == false
  ASSERT result.resolveButtonVisibility == (isUserAdmin && !isResolved)
END FOR
```

**Test Cases**:
1. **Single Sanction - Admin User - Unresolved**: Verify modal displays with visible Resolve button
2. **Single Sanction - Admin User - Resolved**: Verify modal displays with "Resolved" badge (no button)
3. **Single Sanction - Non-Admin User - Unresolved**: Verify modal displays without Resolve button
4. **Single Sanction - Non-Admin User - Resolved**: Verify modal displays with "Resolved" badge
5. **Single Sanction - Edge Case (Offline Mode)**: Verify modal displays correctly when offline

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (zero or multiple sanctions), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL violationView WHERE violationView.sanctionCount != 1 DO
  ASSERT showViolationDetailsModal_original(violationView) == showViolationDetailsModal_fixed(violationView)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different sanction counts, statuses, roles)
- It catches edge cases that manual unit tests might miss (boundary values, role combinations)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for multi-sanction and zero-sanction cases to document the baseline, then write property-based tests capturing that exact behavior and verify it remains unchanged after the fix.

**Test Cases**:
1. **Zero Sanctions Preservation**: Observe that modal displays with hidden sanction section on unfixed code, then verify this continues after fix
2. **Multi-Sanction Display Preservation**: Observe that modal displays all sanctions with sequential resolution logic on unfixed code, then verify this continues after fix
3. **Multi-Sanction RBAC Preservation**: Observe that Resolve buttons show/hide correctly for admins/non-admins on unfixed code, then verify this continues after fix
4. **Student Info Section Preservation**: Verify all student information fields display identically before and after fix
5. **Violation History Preservation**: Verify violation type, level, date, location, reported by fields display identically
6. **Action Button Preservation**: Verify Edit, Print Slip button visibility follows RBAC rules identically
7. **Modal Close Preservation**: Verify clicking close button, overlay, or ESC key works identically

### Unit Tests

- Test modal initialization with single sanction (admin user) - should display with Resolve button
- Test modal initialization with single sanction (non-admin user) - should display without Resolve button
- Test modal initialization with zero sanctions - should display with hidden sanction section
- Test modal initialization with multiple sanctions - should display with sequential resolution logic
- Test isUserAdmin calculation from localStorage session object
- Test isUserAdmin calculation from cookie fallback
- Test Resolve button rendering for resolved vs unresolved sanctions
- Test modal close functionality and class removal

### Property-Based Tests

- Generate random sanction counts (0-10) and verify modal displays successfully for all counts
- Generate random user roles (admin, faculty, officer, csc_officer) and verify RBAC button visibility is correct
- Generate random sanction status combinations (resolved/unresolved) and verify UI badges display correctly
- Generate random violation data and verify all modal sections render without errors
- Test that removing the local `isUserAdmin` declaration in the else block doesn't break multi-sanction logic

### Integration Tests

- Test full user flow: log in as admin → navigate to violations → click View Details for single sanction → verify modal displays → click Resolve → verify sanction resolves
- Test full user flow: log in as faculty → navigate to violations → click View Details for single sanction → verify modal displays without Resolve button
- Test switching between violations with different sanction counts (0, 1, 3) and verify all display correctly
- Test modal behavior in offline mode with pending violations (TEMP- prefixed IDs)
- Test modal behavior with expired user session (should fallback to cookie role)
- Test visual feedback: verify modal animation, overlay darkening, and body scroll lock all work correctly
