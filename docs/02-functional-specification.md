# Functional Specification – Character System

## 1. Purpose

The Character System is the core part of the D&D Simple application.

It allows authenticated users to create, configure, view, and manage Dungeons & Dragons characters through a web interface. The main goal of this system is to give players a clear character builder and a live character sheet that updates automatically when character data changes.

The Character System is divided into two main views:

- My Characters page
- Character Dashboard / Builder page

The system is designed for Dungeons & Dragons 5e-inspired gameplay, but the MVP will not implement the full ruleset. Only the basic mechanics required for character creation, character overview, and basic calculations are included in the first versions.

---

## 2. Authentication Requirement

Users must be authenticated before they can access character-related functionality.

The planned authentication method for the project is Google SSO / OAuth.

### Authentication behavior

- If the user is not authenticated, the application should redirect them to the login page.
- If the user is authenticated, the application should show the My Characters page.
- Characters belong to the authenticated user who created them.
- A user should only be able to view, edit, or delete their own characters.

### Protected pages

The following pages require authentication:

- My Characters page
- Character Dashboard / Builder page
- Character editing page

---

## 3. My Characters Page

## 3.1 Overview

The My Characters page is the main entry point after login.

It allows the user to manage their personal characters. Characters are not connected to campaigns in the MVP. Each character belongs only to the user who created it.

## 3.2 Purpose

The purpose of this page is to give users a simple overview of their existing characters and allow them to create a new one.

## 3.3 Features

The page should support:

- viewing the list of characters
- creating a new character
- opening the Character Dashboard for a character
- editing an existing character
- deleting a character
- displaying an empty state when no characters exist

Search and sorting can be added later, but they are not required for the initial MVP.

## 3.4 Page states

### Not authenticated

If the user is not authenticated:

- redirect to login
- do not display character data

### No characters

If the authenticated user has no characters:

- show an empty state
- display a clear Create Character button

### Has characters

If the authenticated user has one or more characters:

- display character cards in a grid or list
- allow the user to open, edit, or delete a character

## 3.5 Create Character flow

When the user clicks Create Character:

1. A new empty character draft is created.
2. The user is immediately navigated to the Character Dashboard / Builder page.
3. The user can start filling in character data directly in the builder.
4. Changes are saved automatically after the user modifies character data.

No separate modal or first-step form is required for the MVP.

## 3.6 Character Card

Each character is displayed as a card.

A character card should display:

- character name
- level
- species / race
- class
- optional avatar or image placeholder

Character card actions:

- View / Open
- Edit
- Delete

Level is informational in the MVP. It should be displayed, but it should not lock or unlock functionality.

---

## 4. Character Dashboard / Builder

## 4.1 Overview

The Character Dashboard is both a character builder and a live character sheet.

The page has two main areas:

- left sidebar for input and configuration
- right panel for the calculated character sheet

The main interaction model is:

User input -> state update -> recalculation -> auto-save -> UI update

## 4.2 Purpose

The purpose of the Character Dashboard is to let users create and manage a character while immediately seeing the result on the character sheet.

The user should not have to manually calculate common values such as ability modifiers, initiative, passive perception, basic armor class, or proficiency bonus.

## 4.3 Layout

### Left sidebar

The left sidebar is the input and configuration area.

It contains:

- Species selection button
- Background selection button
- Class selection button
- Ability score inputs
- Dynamic class-specific sections after class selection

### Right panel

The right panel displays the live character sheet.

It contains:

- basic character information
- ability scores
- ability modifiers
- saving throws
- skills
- HP
- AC
- initiative
- speed
- senses
- proficiency bonus
- combat and gameplay panel

---

## 5. Left Sidebar

## 5.1 Primary selection buttons

At the top of the sidebar there are three primary selection buttons:

- Species
- Background
- Class

## 5.2 Button state behavior

Before a value is selected, the button displays its default label:

- Species
- Background
- Class

After a value is confirmed, the button displays the selected value.

Examples:

- Species button becomes Elf
- Background button becomes Soldier
- Class button becomes Bard

## 5.3 Interaction behavior

When the user clicks a primary selection button:

1. A selection panel opens.
2. The user chooses one item from the list.
3. A confirmation panel is displayed.
4. The user confirms or cancels the selection.
5. If confirmed, the selected value is stored in character state.
6. The button label updates.
7. The character sheet recalculates where needed.
8. The change is saved automatically.

---

## 6. Selection Panels

Selection panels are used for selecting Class, Species, and Background.

They should use the same general interaction pattern, but each panel displays data specific to the selected category.

The data for Class, Species, and Background should come from definition data stored in the database:

- ClassDefinition
- SpeciesDefinition
- BackgroundDefinition

Definition data describes available game options. User character data stores what the user selected.

---

## 7. Class Selection Flow

## 7.1 Opening the panel

The user clicks the Class button in the left sidebar.

A center-screen panel opens and displays the available classes.

## 7.2 Class list

The class list should display all available classes.

Each class item may include:

- class name
- source
- optional icon
- navigation indicator
- short preview text if available

The class list is used only for selection. It should not display every class feature in detail.

## 7.3 Class confirmation panel

After selecting a class from the list, the user sees a class confirmation panel.

The confirmation panel should display a read-only preview of the selected class.

The preview should include:

- class name
- source
- description
- primary ability
- hit die
- saving throw proficiencies
- basic class traits
- class features from levels 1 to 20

The MVP should avoid storing or reproducing unnecessary copyrighted rule text. Class data should be summarized or limited to the information needed for the project demonstration.

## 7.4 Class confirmation actions

The confirmation panel has two actions:

- ADD CLASS
- CANCEL

### ADD CLASS

When the user clicks ADD CLASS:

- the selected class is applied to the character
- the Class button label updates
- class-specific sections appear in the left sidebar
- relevant character sheet values are recalculated
- the character is auto-saved

### CANCEL

When the user clicks CANCEL:

- the selected class is not applied
- the panel closes
- the previous character state remains unchanged

## 7.5 Preview mode and interactive mode

The same class definition data is used in two different modes.

### Preview Mode

Preview Mode is shown in the center confirmation panel.

Characteristics:

- read-only
- displays class information
- shows levels 1 to 20
- used before the user confirms the class

### Interactive Mode

Interactive Mode is shown in the left sidebar after the class is confirmed.

Characteristics:

- displayed inside dynamic class sections
- can contain selectable options
- can contain subclass choices, feature choices, or other future class-related inputs
- updates character state when the user changes something
- triggers recalculation and auto-save

---

## 8. Species Selection Flow

## 8.1 Opening the panel

The user clicks the Species button in the left sidebar.

A center-screen panel opens and displays the available species.

## 8.2 Species list

Each species item may include:

- species name
- source
- optional icon
- short description

## 8.3 Species confirmation panel

After selecting a species, the user sees a read-only confirmation panel.

The panel may display:

- species name
- source
- description
- base speed
- senses if available
- relevant traits

## 8.4 Confirming species

When the user confirms the species:

- the selected species is applied to the character
- the Species button label updates
- species-related values are recalculated
- speed and senses may update
- the character is auto-saved

## 8.5 Cancelling species selection

When the user cancels:

- the selected species is not applied
- the panel closes
- the previous character state remains unchanged

---

## 9. Background Selection Flow

## 9.1 Opening the panel

The user clicks the Background button in the left sidebar.

A center-screen panel opens and displays the available backgrounds.

## 9.2 Background list

Each background item may include:

- background name
- source
- optional icon
- short description

## 9.3 Background confirmation panel

After selecting a background, the user sees a read-only confirmation panel.

The panel may display:

- background name
- source
- description
- proficiencies or benefits if included in MVP data
- relevant background traits

## 9.4 Confirming background

When the user confirms the background:

- the selected background is applied to the character
- the Background button label updates
- background-related values may update
- the character is auto-saved

## 9.5 Cancelling background selection

When the user cancels:

- the selected background is not applied
- the panel closes
- the previous character state remains unchanged

---

## 10. Ability Scores

## 10.1 Overview

Ability scores are one of the main inputs in the Character Builder.

The system should support the six standard ability scores:

- Strength
- Dexterity
- Constitution
- Intelligence
- Wisdom
- Charisma

## 10.2 Input options

The user can set ability scores in two ways:

- manually entering values
- using a ROLL button

## 10.3 Manual input

The user can manually enter ability score values.

The MVP should validate that entered values are numeric and within a reasonable range.

## 10.4 Rolling logic

When the user clicks ROLL for an ability score:

1. Roll 4d6.
2. Remove the lowest die.
3. Sum the remaining three dice.
4. Store the result as the ability score.
5. Recalculate dependent values.
6. Auto-save the character.

Example:

- roll: 6, 5, 3, 1
- remove lowest: 1
- result: 6 + 5 + 3 = 14

---

## 11. Automatic Calculation System

## 11.1 Overview

The system automatically calculates derived character sheet values from character input.

The calculation system should be separated from UI components so it can be reused and tested.

## 11.2 Calculation trigger

Recalculation should happen when the user changes relevant character data, such as:

- ability score
- class
- species
- background
- level
- feature selection
- future equipment or armor selection

## 11.3 Calculation flow

The calculation flow is:

Character input -> calculation utilities -> derived values -> character sheet display

After recalculation, the updated character state should be auto-saved.

## 11.4 Derived values should not be manually edited

Derived values should normally be calculated from current character state.

The system should avoid manual editing of derived values unless a future override system is intentionally added.

---

## 12. Calculation Rules

## 12.1 Ability modifier

Formula:

modifier = floor((score - 10) / 2)

Examples:

| Score | Modifier |
| ----- | -------- |
| 8     | -1       |
| 10    | 0        |
| 12    | +1       |
| 14    | +2       |
| 16    | +3       |
| 18    | +4       |

## 12.2 Proficiency bonus

| Level | Proficiency Bonus |
| ----- | ----------------- |
| 1-4   | +2                |
| 5-8   | +3                |
| 9-12  | +4                |
| 13-16 | +5                |
| 17-20 | +6                |

## 12.3 Saving throws

Formula:

Saving Throw = Ability Modifier + Proficiency Bonus, if proficient

If the character is not proficient in that saving throw:

Saving Throw = Ability Modifier

## 12.4 Skills

Formula:

Skill = Related Ability Modifier + Proficiency Bonus, if proficient

If the character is not proficient in that skill:

Skill = Related Ability Modifier

Future support may include expertise or other bonuses.

## 12.5 Passive perception

Formula:

Passive Perception = 10 + Perception skill

## 12.6 Passive investigation

Formula:

Passive Investigation = 10 + Investigation skill

## 12.7 Passive insight

Formula:

Passive Insight = 10 + Insight skill

## 12.8 Initiative

Formula:

Initiative = Dexterity Modifier

## 12.9 Armor Class MVP

MVP formula:

Armor Class = 10 + Dexterity Modifier

Future versions should support armor and shield calculations.

## 12.10 Hit Points MVP

MVP level 1 formula:

Max HP = Class Hit Die + Constitution Modifier

Future extended formula:

Max HP = Level-based class HP + Constitution Modifier per level + additional bonuses

## 12.11 Attack modifier

Basic formula:

Attack Modifier = Relevant Ability Modifier + Proficiency Bonus, if proficient

For MVP:

- melee attacks usually use Strength
- ranged attacks usually use Dexterity

## 12.12 Damage modifier

Basic formula:

Damage = Weapon Damage + Relevant Ability Modifier

Full weapon, item, and class-specific damage rules are not part of the initial MVP.

## 12.13 Spell Save DC

Formula:

Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier

## 12.14 Spell Attack Bonus

Formula:

Spell Attack Bonus = Proficiency Bonus + Spellcasting Ability Modifier

## 12.15 Speed

Speed comes from the selected species.

If no species is selected, the system may display an empty value or default placeholder.

## 12.16 Senses

MVP senses include:

- passive perception
- passive investigation
- passive insight

Future versions may include darkvision, blindsight, tremorsense, or other senses if supported by species or features.

---

## 13. Dynamic Class Sections

## 13.1 Overview

After the user confirms a class, class-specific sections appear in the left sidebar.

These sections are based on the selected class definition.

## 13.2 Display behavior

Dynamic class sections should:

- appear below the primary selection buttons and ability scores
- be scrollable if there is too much content
- show class information from levels 1 to 20
- not be locked by current character level in the MVP

## 13.3 Level handling

Level is informational only in the MVP.

The system does not prevent the user from viewing or editing class-related information from higher levels.

The user is responsible for filling in appropriate values for their intended character.

## 13.4 Section types

Dynamic sections can be:

- informational
- expandable / collapsible
- interactive

## 13.5 Informational sections

Informational sections display read-only class information.

Examples:

- class traits
- feature descriptions
- level-based feature overview

## 13.6 Interactive sections

Interactive sections allow the user to make choices that affect character state.

Examples:

- subclass selection
- feature options
- proficiency choices
- future spell choices

Interactive sections should update character state, trigger recalculation, and auto-save changes.

---

## 14. Right Panel – Live Character Sheet

## 14.1 Overview

The right panel displays a live character sheet preview.

It updates automatically when the user changes data in the left sidebar.

## 14.2 Displayed information

The right panel should display:

- character name
- level
- class
- species
- background
- ability scores
- ability modifiers
- saving throws
- skills
- passive senses
- proficiency bonus
- initiative
- armor class
- current HP
- max HP
- speed

## 14.3 Live update behavior

When input changes:

1. Character state updates.
2. Calculation utilities recalculate derived values.
3. The right panel updates immediately.
4. Character data is auto-saved.

---

## 15. Combat & Gameplay Panel

## 15.1 Overview

The Combat & Gameplay Panel is part of the right side character sheet.

Its purpose is to give the player quick access to information used during gameplay.

## 15.2 Sections

The panel should include placeholders or MVP sections for:

- Actions
- Bonus Actions
- Reactions
- Spells
- Inventory
- Features & Traits
- Notes

## 15.3 MVP behavior

For the MVP, this panel can display placeholder sections or simple read-only lists.

More advanced interaction is planned for later iterations.

## 15.4 Future behavior

Future versions may include:

- usable actions
- spell management
- inventory interaction
- item effects
- dice roll integration
- combat state tracking

---

## 16. Auto-save

## 16.1 Overview

Character saving should happen automatically after changes.

The user should not need to click a manual Save button for normal editing.

## 16.2 Auto-save triggers

Auto-save should trigger after changes such as:

- character name change
- level change
- class selection
- species selection
- background selection
- ability score change
- class feature selection
- future inventory or equipment changes

## 16.3 Auto-save behavior

The system should avoid saving on every keystroke if that causes too many API requests.

A debounce or delayed save mechanism can be used.

Recommended behavior:

- update local UI state immediately
- wait briefly after the user stops editing
- send update request to backend
- show a saving/saved/error indicator if needed

## 16.4 Error handling

If auto-save fails:

- show an error state
- keep local changes visible
- allow retrying automatically or manually
- do not silently discard user input

---

## 17. Data Model Concept

## 17.1 User character data

User character data represents the specific character created by a user.

Examples:

- character name
- level
- selected class
- selected species
- selected background
- ability scores
- selected feature options

## 17.2 Definition data

Definition data represents reusable game options available to all users.

Definition data includes:

- ClassDefinition
- SpeciesDefinition
- BackgroundDefinition
- ClassFeatureDefinition

## 17.3 Separation of data

The system should separate definition data from user character data.

Example:

- ClassDefinition describes what a Bard is.
- Character stores that the user selected Bard for their character.

This makes it easier to reuse the same class, species, and background data across many users and characters.

---

## 18. MVP Scope

## 18.1 Included in MVP

The MVP Character System includes:

- Google SSO / OAuth authentication
- My Characters page
- create character flow
- Character Dashboard / Builder page
- class selection flow
- species selection flow
- background selection flow
- ability score input
- ability score rolling
- automatic ability modifier calculation
- basic derived calculations
- live character sheet preview
- auto-save after changes
- basic backend persistence

## 18.2 Not included in MVP

The MVP does not include:

- full Dungeons & Dragons rules engine
- full campaign management
- multiplayer gameplay
- real-time synchronization
- full inventory item effects
- complete spell system
- full virtual tabletop
- voice or video communication
- mobile application
- advanced item, feat, or subclass automation

## 18.3 Planned future features

Future iterations may include:

- inventory system
- drag-and-drop inventory
- dice rolling system
- dice roll history
- session system
- Dungeon Master and player roles
- virtual tabletop
- token movement
- WebSocket real-time synchronization
- rule engine improvements
- UI polish
- deployment improvements

---

## 19. Open Questions

The following details can be defined later:

- exact visual style of the Character Dashboard
- exact class/species/background data format
- whether class data will be manually seeded or imported from a source
- final spell system behavior
- final inventory behavior
- final equipment and armor calculation behavior
- exact deployment provider

---

## 20. Acceptance Criteria for the Character System MVP

The Character System MVP is considered complete when:

- authenticated users can access the application
- unauthenticated users are redirected to login
- users can view their characters
- users can create a new empty character
- users can open the Character Dashboard
- users can select class, species, and background
- users can enter or roll ability scores
- modifiers and basic derived values calculate automatically
- the right character sheet updates live
- character changes are auto-saved
- character data persists in the database
- users cannot access other users' characters
