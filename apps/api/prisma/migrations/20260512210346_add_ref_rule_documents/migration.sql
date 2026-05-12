-- CreateTable
CREATE TABLE "ref_rule_documents" (
    "category" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT,
    "sourceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ref_rule_documents_pkey" PRIMARY KEY ("category","index")
);
