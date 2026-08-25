-- CreateTable
CREATE TABLE "WebhookRequest" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "body" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WebhookRequest" ADD CONSTRAINT "WebhookRequest_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "Endpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
