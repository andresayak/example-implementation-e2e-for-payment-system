import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker/locale/en';
import {
  ConfigType,
  PaymentStatus,
  PaymentType,
  StoreType,
} from '../src/types';

describe('Application End-to-End Test', () => {
  let app: INestApplication;
  let storeId: number;
  let totalAmountAfterFee = 0;
  const store = {
    name: faker.company.name(),
    feeRate: 10,
  };

  const config: ConfigType = {
    fixedFee: 10,
    feeRate: 5,
    blockRate: 10,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Configuration Management', () => {
    it('should fetch the default configuration', () => {
      return request(app.getHttpServer()).get('/config').expect(200).expect({
        fixedFee: 0,
        feeRate: 0,
        blockRate: 0,
      });
    });

    it('should save a new configuration', async () => {
      await request(app.getHttpServer())
        .post('/config')
        .send(config)
        .expect(201);

      await request(app.getHttpServer())
        .get('/config')
        .expect(200)
        .expect(config);
    });
  });

  describe('Store Management', () => {
    it('should save a new store', async () => {
      await request(app.getHttpServer())
        .post('/store')
        .send(store)
        .expect(201)
        .expect(
          (response: {
            body: {
              id: number;
            };
          }) => {
            expect(response.body.id).toBeTruthy();
            storeId = response.body.id;
          },
        );
    });

    it('should fetch a store by ID', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect({
          ...store,
          availableBalance: 0,
          blockedBalance: 0,
          id: storeId,
        });
    });
  });

  describe('Payment Operations', () => {
    const amounts = [100, 500, 1000];

    const payments: {
      id: number;
      amount: number;
    }[] = [];

    for (const amount of amounts) {
      it(`should process a payment of ${amount} USD`, async () => {
        await request(app.getHttpServer())
          .post(`/store/${storeId}/payment`)
          .send({
            amount,
          })
          .expect(201)
          .expect(
            (response: {
              body: {
                id: number;
              };
            }) => {
              expect(response.body.id).toBeTruthy();
              payments.push({
                id: response.body.id,
                amount,
              });
            },
          );
      });
    }

    it(`should fetch all payments with status RECEIVED`, async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}/payments`)
        .expect(200)
        .expect((response) => {
          expect(response.body.length).toEqual(3);

          totalAmountAfterFee = response.body.reduce(
            (acc, cur) => acc + cur.amountAfterFee,
            0,
          );

          expect(response.body).toEqual(
            expect.arrayContaining(
              payments.map((item) =>
                expect.objectContaining({
                  ...item,
                  storeId,
                  status: PaymentStatus.RECEIVED,
                }),
              ),
            ),
          );
        });
    });

    it('should fetch store details after payment processing', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect({
          ...store,
          availableBalance: 0,
          blockedBalance: totalAmountAfterFee,
          id: storeId,
        });
    });

    it(`should update payment status to PROCESSED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/processed`)
        .send({
          ids: [payments[0].id, payments[1].id],
        })
        .expect(201)
        .expect(
          ({
            body: { status, amount },
          }: {
            body: {
              status: boolean;
              amount: number;
            };
          }) => {
            expect(status).toBeTruthy();
            expect(amount).toEqual(430);
          },
        );
    });

    it('Should fetch store details with updated balances', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect(({ body }: { body: StoreType }) => {
          expect(body.availableBalance + body.blockedBalance).toEqual(
            totalAmountAfterFee,
          );
          expect(body.availableBalance).not.toEqual(0);
          expect(body.blockedBalance).not.toEqual(0);
        });
    });

    it(`should update payment status to COMPLETED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/completed`)
        .send({
          ids: [payments[0].id],
        })
        .expect(201);
    });

    it('Should fetch store details with updated balances', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect(({ body }: { body: StoreType }) => {
          expect(body.availableBalance + body.blockedBalance).toEqual(
            totalAmountAfterFee,
          );
          expect(body.availableBalance).not.toEqual(0);
          expect(body.blockedBalance).not.toEqual(0);
        });
    });

    it(`should fetch payments with all statuses`, async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}/payments`)
        .expect(200)
        .expect((response) => {
          expect(response.body.length).toEqual(3);
          expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                ...payments[0],
                storeId,
                status: PaymentStatus.COMPLETED,
              }),
              expect.objectContaining({
                ...payments[1],
                storeId,
                status: PaymentStatus.PROCESSED,
              }),
              expect.objectContaining({
                ...payments[2],
                storeId,
                status: PaymentStatus.RECEIVED,
              }),
            ]),
          );
        });
    });

    it(`should update all remaining payments to PROCESSED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/processed`)
        .send({
          ids: [payments[2].id],
        })
        .expect(201);
    });

    it(`should update all remaining payments to COMPLETED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/completed`)
        .send({
          ids: [payments[1].id, payments[2].id],
        })
        .expect(201);
    });

    it(`should fetch payments with all COMPLETED statuses`, async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}/payments`)
        .expect(200)
        .expect((response) => {
          expect(response.body.length).toEqual(3);
          expect(response.body).toEqual(
            expect.arrayContaining(
              payments.map((item) =>
                expect.objectContaining({
                  ...item,
                  storeId,
                  status: PaymentStatus.COMPLETED,
                }),
              ),
            ),
          );
        });
    });

    it('should make all balance available after completing all payments', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect(({ body }: { body: StoreType }) => {
          expect(body.availableBalance).toEqual(totalAmountAfterFee);
          expect(body.blockedBalance).toEqual(0);
        });
    });
  });

  describe('Fee Calculations and Adjustments', () => {
    const amount = 1000;
    let paymentId: number;
    it(`should create a payment and calculate fees`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/payment`)
        .send({
          amount,
        })
        .expect(201)
        .expect(
          (response: {
            body: {
              id: number;
            };
          }) => {
            expect(response.body.id).toBeTruthy();
            paymentId = response.body.id;
          },
        );
    });

    it(`should fetch payment details and verify fee calculations`, async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}/payment/${paymentId}`)
        .send({
          amount,
        })
        .expect(200)
        .expect((response: { body: PaymentType }) => {
          expect(response.body.feeAmounts).toStrictEqual({
            system: (amount * config.feeRate) / 100,
            fixed: config.fixedFee,
            store: (amount * store.feeRate) / 100,
          });
          expect(response.body.blockedAmount).toEqual(
            (amount * config.blockRate) / 100,
          );
        });
    });

    it('should reject the payment and verify balances', async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/rejected`)
        .send({
          ids: [paymentId],
        })
        .expect(201);
    });

    it('should fetch right balances after reject', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect(({ body }: { body: StoreType }) => {
          expect(body.availableBalance).toEqual(totalAmountAfterFee);
          expect(body.blockedBalance).toEqual(0);
        });
    });
  });

  describe('Payout Management', () => {
    const amount = 1000;
    let paymentId: number;
    let blockedBalance = 0;
    let availableBalance = 0;
    it(`should save a payment and update balances`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/payment`)
        .send({
          amount,
        })
        .expect(201)
        .expect(
          (response: {
            body: {
              id: number;
            };
          }) => {
            expect(response.body.id).toBeTruthy();
            paymentId = response.body.id;
          },
        );
    });

    it(`should update all remaining payments to PROCESSED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/processed`)
        .send({
          ids: [paymentId],
        })
        .expect(201);
    });
    it(`Should fetch right payment balances`, async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}/payment/${paymentId}`)
        .send({
          amount,
        })
        .expect(200)
        .expect((response: { body: PaymentType }) => {
          totalAmountAfterFee += response.body.amountAfterFee;
          blockedBalance = response.body.blockedAmount;
          availableBalance = totalAmountAfterFee - blockedBalance;
        });
    });

    it('Should fetch right store balances', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect({
          ...store,
          availableBalance,
          blockedBalance,
          id: storeId,
        });
    });

    it('Should process payout for right payments', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      await request(app.getHttpServer())
        .post(`/store/${storeId}/payout`)
        .expect(201)
        .expect(
          ({
            body: { amount, ids },
          }: {
            body: { amount: number; ids: number[] };
          }) => {
            expect(ids).toEqual([1, 2, 3, 5]);
            expect(amount).toEqual(availableBalance);
          },
        );
    });

    it('Should fetch right details for store', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect({
          ...store,
          availableBalance: 0,
          blockedBalance: 100,
          id: storeId,
          lastPaymentAt: new Date('2020-01-01').toISOString(),
        });
    });

    it('Should fail next payout request', async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/payout`)
        .expect(400)
        .expect(({ body }: { body: any }) => {
          expect(body.message).toEqual('you can payout only one time per day');
        });
    });

    it(`should update all remaining payments to COMPLETED`, async () => {
      await request(app.getHttpServer())
        .post(`/store/${storeId}/completed`)
        .send({
          ids: [paymentId],
        })
        .expect(201);
    });

    it('Should process next payout after 24 hours', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-02'));
      await request(app.getHttpServer())
        .post(`/store/${storeId}/payout`)
        .expect(201)
        .expect(
          ({
            body: { amount, ids },
          }: {
            body: { amount: number; ids: number[] };
          }) => {
            expect(ids).toEqual([5]);
            expect(amount).toEqual(100);
          },
        );
    });

    it('Should fetch right zero balances', async () => {
      await request(app.getHttpServer())
        .get(`/store/${storeId}`)
        .expect(200)
        .expect({
          ...store,
          availableBalance: 0,
          blockedBalance: 0,
          id: storeId,
          lastPaymentAt: new Date('2020-01-02').toISOString(),
        });
    });
  });
});
