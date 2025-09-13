import ast
import glob
import os
import sys

# Add the src directory to the Python path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))


def get_class_structure(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)

    classes = {"pydantic": {}, "typeddict": {}}
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            class_name = node.name
            fields = {}
            # Determine if it's a Pydantic BaseModel or TypedDict
            is_pydantic = any(
                isinstance(base, ast.Name) and base.id == "BaseModel"
                for base in node.bases
            )
            is_typeddict = any(
                isinstance(base, ast.Name) and base.id == "TypedDict"
                for base in node.bases
            )

            for item in node.body:
                if isinstance(
                    item, ast.AnnAssign
                ):  # Annotated assignment (e.g., name: str)
                    field_name = (
                        item.target.id
                        if isinstance(item.target, ast.Name)
                        else ast.unparse(item.target).strip()
                    )
                    field_type = ast.unparse(item.annotation).strip()
                    fields[field_name] = field_type
                elif isinstance(item, ast.Assign) and is_pydantic:
                    # Handle Pydantic Field assignments where type might be inferred or in annotation
                    for target in item.targets:
                        if isinstance(target, ast.Name):
                            field_name = target.id
                            # Try to find the annotation if it exists for this field
                            # This is a simplification; a more robust solution might involve
                            # looking at AnnAssign nodes that precede this Assign node
                            if field_name not in fields:
                                # If not already captured by AnnAssign, try to get type from value
                                if (
                                    isinstance(item.value, ast.Call)
                                    and isinstance(item.value.func, ast.Name)
                                    and item.value.func.id == "Field"
                                ):
                                    # For Field, we assume the type is already in AnnAssign or will be checked by Pydantic
                                    pass
                                else:
                                    # For simple assignments, we might not care about their types in this context
                                    pass

            if is_pydantic:
                classes["pydantic"][class_name] = fields
            elif is_typeddict:
                classes["typeddict"][class_name] = fields
    return classes


def normalize_type(type_str):
    # Simple normalization for common cases
    type_str = type_str.replace("'", "").replace('"', "")  # Remove quotes
    if " | None" in type_str:
        return type_str.replace(" | None", "").strip() + " | None"
    if "Optional[" in type_str:
        return type_str.replace("Optional[", "").replace("]", "").strip() + " | None"
    # Handle nested Pydantic/TypedDict references
    type_str = type_str.replace("Pydantic", "TypedDict")
    return type_str.strip()


def compare_model_structures(pydantic_classes, typeddict_classes, file_name):
    for pydantic_class_name, pydantic_fields in pydantic_classes.items():
        # Assuming TypedDict class names correspond to Pydantic class names
        # e.g., CharacterPydantic -> CharacterTypedDict
        typeddict_class_name = pydantic_class_name.replace("Pydantic", "TypedDict")

        typeddict_fields = typeddict_classes[typeddict_class_name]

        assert set(pydantic_fields.keys()) == set(typeddict_fields.keys()), (
            f"Field names do not match between {pydantic_class_name} and "
            f"{typeddict_class_name} in {file_name}"
        )

        for field_name in pydantic_fields:
            pydantic_type = normalize_type(pydantic_fields[field_name])
            typeddict_type = normalize_type(typeddict_fields[field_name])

            # Special handling for forward references and quoted types
            if pydantic_type.startswith('"') and pydantic_type.endswith('"'):
                pydantic_type = pydantic_type[1:-1]
            if typeddict_type.startswith('"') and typeddict_type.endswith('"'):
                typeddict_type = typeddict_type[1:-1]

            assert pydantic_type == typeddict_type, (
                f"Type mismatch for field {field_name} in {pydantic_class_name} "
                f"({file_name}): Pydantic '{pydantic_type}' vs TypedDict '{typeddict_type}'"
            )


def _get_all_declare_model_structures():
    declare_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../src/versions/v1/declare")
    )

    python_files = glob.glob(os.path.join(declare_dir, "*.py"))

    all_structures = {}
    for file_path in python_files:
        file_name = os.path.basename(file_path)
        structures = get_class_structure(file_path)
        all_structures[file_name] = structures
    return all_structures


def test_pydantic_typeddict_structure_consistency():
    all_structures = _get_all_declare_model_structures()

    for file_name, structures in all_structures.items():
        print(f"Processing {file_name} for structural consistency...")
        pydantic_classes = structures["pydantic"]
        typeddict_classes = structures["typeddict"]

        # Ensure that for every Pydantic class, there's a corresponding TypedDict class
        # This check is needed here because compare_model_structures assumes existence
        for pydantic_class_name in pydantic_classes:
            typeddict_class_name = pydantic_class_name.replace("Pydantic", "TypedDict")
            assert (
                typeddict_class_name in typeddict_classes
            ), f"Missing corresponding TypedDict for {pydantic_class_name} in {file_name}"

        # Ensure that for every TypedDict class, there's a corresponding Pydantic class
        for typeddict_class_name in typeddict_classes:
            pydantic_class_name = typeddict_class_name.replace("TypedDict", "Pydantic")
            assert (
                pydantic_class_name in pydantic_classes
            ), f"Missing corresponding Pydantic for {typeddict_class_name} in {file_name}"

        compare_model_structures(pydantic_classes, typeddict_classes, file_name)

    print(
        "All Pydantic and TypedDict models have consistent structures (field names and types)."
    )


def test_pydantic_typeddict_pair_existence():
    all_structures = _get_all_declare_model_structures()

    for file_name, structures in all_structures.items():
        print(f"Processing {file_name} for pair existence...")
        pydantic_classes = structures["pydantic"]
        typeddict_classes = structures["typeddict"]

        # Check if the number of Pydantic and TypedDict classes match
        assert len(pydantic_classes) == len(typeddict_classes), (
            f"Number of Pydantic classes ({len(pydantic_classes)}) does not match "
            f"number of TypedDict classes ({len(typeddict_classes)}) in {file_name}"
        )

        # Ensure that for every Pydantic class, there's a corresponding TypedDict class
        for pydantic_class_name in pydantic_classes:
            typeddict_class_name = pydantic_class_name.replace("Pydantic", "TypedDict")
            assert (
                typeddict_class_name in typeddict_classes
            ), f"Missing corresponding TypedDict for {pydantic_class_name} in {file_name}"

        # Ensure that for every TypedDict class, there's a corresponding Pydantic class
        for typeddict_class_name in typeddict_classes:
            pydantic_class_name = typeddict_class_name.replace("TypedDict", "Pydantic")
            assert (
                pydantic_class_name in pydantic_classes
            ), f"Missing corresponding Pydantic for {typeddict_class_name} in {file_name}"

    print("All Pydantic models have corresponding TypedDict models and vice versa.")
