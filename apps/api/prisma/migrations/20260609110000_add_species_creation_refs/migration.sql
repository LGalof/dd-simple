-- CreateTable
CREATE TABLE "ref_species_traits" (
    "id" UUID NOT NULL,
    "speciesIndex" TEXT NOT NULL,
    "traitIndex" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_species_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_species_size_options" (
    "id" UUID NOT NULL,
    "speciesIndex" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sourceJson" JSONB,

    CONSTRAINT "ref_species_size_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_subspecies" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speciesIndex" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_subspecies_pkey" PRIMARY KEY ("index")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_species_traits_speciesIndex_traitIndex_key" ON "ref_species_traits"("speciesIndex", "traitIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ref_species_size_options_speciesIndex_size_key" ON "ref_species_size_options"("speciesIndex", "size");

-- AddForeignKey
ALTER TABLE "ref_species_traits" ADD CONSTRAINT "ref_species_traits_speciesIndex_fkey" FOREIGN KEY ("speciesIndex") REFERENCES "ref_species"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_species_size_options" ADD CONSTRAINT "ref_species_size_options_speciesIndex_fkey" FOREIGN KEY ("speciesIndex") REFERENCES "ref_species"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_subspecies" ADD CONSTRAINT "ref_subspecies_speciesIndex_fkey" FOREIGN KEY ("speciesIndex") REFERENCES "ref_species"("index") ON DELETE CASCADE ON UPDATE CASCADE;
