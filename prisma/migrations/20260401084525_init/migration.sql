-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BtcHolding" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalBtc" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BtcHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BtcPrice" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BtcPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPrice" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MnavRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mnav" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "btcHoldings" DOUBLE PRECISION NOT NULL,
    "btcPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MnavRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ticker_key" ON "Company"("ticker");

-- CreateIndex
CREATE INDEX "BtcHolding_companyId_date_idx" ON "BtcHolding"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BtcHolding_companyId_date_key" ON "BtcHolding"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BtcPrice_date_key" ON "BtcPrice"("date");

-- CreateIndex
CREATE INDEX "BtcPrice_date_idx" ON "BtcPrice"("date");

-- CreateIndex
CREATE INDEX "StockPrice_ticker_date_idx" ON "StockPrice"("ticker", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StockPrice_ticker_date_key" ON "StockPrice"("ticker", "date");

-- CreateIndex
CREATE INDEX "MnavRecord_companyId_date_idx" ON "MnavRecord"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MnavRecord_companyId_date_key" ON "MnavRecord"("companyId", "date");

-- AddForeignKey
ALTER TABLE "BtcHolding" ADD CONSTRAINT "BtcHolding_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MnavRecord" ADD CONSTRAINT "MnavRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
