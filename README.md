## Example of implementation e2e testing for Payment and Store Management System

This project implements a robust suite of end-to-end tests to validate the functionality of a payment and store management system. It ensures smooth operation across various business processes, including configuration management, store handling, payment operations, fee calculations, and payout management.

## Features Covered in Tests

### Configuration Management
- Fetch and validate the default configuration settings.
- Save and retrieve custom configuration values.

### Store Management
- Create and store details for new stores.
- Fetch store data with updated balances after various operations.

### Payment Operations
- Process payments for varying amounts.
- Validate the statuses of payments: RECEIVED, PROCESSED, COMPLETED.
- Ensure store balances are correctly updated after each operation.

### Fee Calculations and Adjustments
- Compute dynamic fees, including fixed and percentage-based rates.
- Adjust store balances upon rejection of payments.

### Payout Management
- Process payouts while verifying balance consistency.
- Enforce business rules, such as a single payout per day.
- Handle sequential payouts and validate final store balances.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

```
