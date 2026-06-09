-- CreateTable
CREATE TABLE "ref_class_levels" (
    "id" UUID NOT NULL,
    "classIndex" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sourceJson" JSONB,

    CONSTRAINT "ref_class_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_class_features" (
    "id" UUID NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classIndex" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "details" JSONB,
    "sourceJson" JSONB,

    CONSTRAINT "ref_class_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_class_levels_classIndex_level_key" ON "ref_class_levels"("classIndex", "level");

-- CreateIndex
CREATE UNIQUE INDEX "ref_class_features_index_key" ON "ref_class_features"("index");

-- AddForeignKey
ALTER TABLE "ref_class_levels" ADD CONSTRAINT "ref_class_levels_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_features" ADD CONSTRAINT "ref_class_features_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE CASCADE ON UPDATE CASCADE;
