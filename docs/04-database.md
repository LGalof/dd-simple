## Data Model

### Overview
The data model separates system definitions from user-created character data.

Definition data describes available options such as classes, species, backgrounds, and class features.

Character data stores the actual choices and values selected by the user.

---

## Core Entities

### User
Represents an authenticated application user.

Fields:
- id
- email
- displayName
- passwordHash
- createdAt
- updatedAt

Relationships:
- User has many Characters

---

### Character
Represents a Dungeons & Dragons character created by a user.

Fields:
- id
- userId
- name
- level
- speciesId
- backgroundId
- classId
- avatarUrl
- createdAt
- updatedAt

Relationships:
- Character belongs to User
- Character belongs to SpeciesDefinition
- Character belongs to BackgroundDefinition
- Character belongs to ClassDefinition
- Character has one CharacterAbilityScores
- Character has one CharacterSheetStats
- Character has many CharacterFeatureSelections

---

### CharacterAbilityScores
Stores the six main ability scores of a character.

Fields:
- characterId
- strength
- dexterity
- constitution
- intelligence
- wisdom
- charisma

---

### CharacterSheetStats
Stores gameplay-related values displayed on the character sheet.

Fields:
- characterId
- maxHp
- currentHp
- temporaryHp
- armorClass
- initiative
- speed
- proficiencyBonus

---

## Definition Entities

### ClassDefinition
Represents a playable class.

Examples:
- Bard
- Fighter
- Wizard

Fields:
- id
- name
- description

Relationships:
- ClassDefinition has many ClassFeatureDefinitions

---

### SpeciesDefinition
Represents a playable species.

Examples:
- Human
- Elf
- Dwarf

Fields:
- id
- name
- description
- speed

---

### BackgroundDefinition
Represents a character background.

Fields:
- id
- name
- description

---

### ClassFeatureDefinition
Represents a class-specific feature or section.

Examples for Bard:
- Core Bard Traits
- Bardic Inspiration
- Spellcasting
- Expertise
- Jack of All Trades
- Bard Subclass

Fields:
- id
- classId
- name
- description
- levelRequirement
- sectionType
- requiresInput

Relationships:
- ClassFeatureDefinition belongs to ClassDefinition

---

## User Selection Entities

### CharacterFeatureSelection
Stores the values selected or entered by the user for dynamic class features.

Fields:
- id
- characterId
- featureId
- selectedValue
- customValue
- createdAt
- updatedAt

Relationships:
- CharacterFeatureSelection belongs to Character
- CharacterFeatureSelection belongs to ClassFeatureDefinition

---

## Data Model Principle

The system separates:
- definition data
- user character data

Definition data describes what can be selected.
Character data stores what the user selected.

This allows the UI to dynamically render character builder sections based on the selected class.
