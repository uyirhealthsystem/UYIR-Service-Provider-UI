import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { getBlocks, getDistricts, getVillages } from "../../api/healthPartner";
import { OptionSheet, SelectField, type Option } from "../../ui/components";
import { listFrom } from "../../ui/format";

export type LocationValue = { districtId: string; blockId: string; villageId: string };

const toOptions = (data: any): Option[] =>
  listFrom(data).map((item: any) => ({ id: String(item.id), name: String(item.name || item.id) }));

/**
 * District -> Block -> Village cascade used by registration and edit profile.
 * District is required by the HP service; block and village are optional,
 * and a village needs its block (the server re-checks both).
 */
export function useLocation(initial?: Partial<LocationValue>) {
  const [value, setValue] = useState<LocationValue>({
    districtId: initial?.districtId || "",
    blockId: initial?.blockId || "",
    villageId: initial?.villageId || "",
  });
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [villages, setVillages] = useState<Option[]>([]);
  const [loading, setLoading] = useState({ districts: true, blocks: false, villages: false });
  const [error, setError] = useState("");

  const patchLoading = (patch: Partial<typeof loading>) => setLoading((prev) => ({ ...prev, ...patch }));

  const loadDistricts = useCallback(async () => {
    try {
      setError("");
      patchLoading({ districts: true });
      setDistricts(toOptions(await getDistricts()));
    } catch (e: any) {
      setError(e?.message || "Unable to load districts.");
    } finally {
      patchLoading({ districts: false });
    }
  }, []);

  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

  useEffect(() => {
    if (!value.districtId) {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    patchLoading({ blocks: true });
    getBlocks(value.districtId)
      .then((data) => !cancelled && setBlocks(toOptions(data)))
      .catch((e) => !cancelled && setError(e?.message || "Unable to load blocks."))
      .finally(() => !cancelled && patchLoading({ blocks: false }));
    return () => {
      cancelled = true;
    };
  }, [value.districtId]);

  useEffect(() => {
    if (!value.districtId || !value.blockId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    patchLoading({ villages: true });
    getVillages(value.districtId, value.blockId)
      .then((data) => !cancelled && setVillages(toOptions(data)))
      .catch((e) => !cancelled && setError(e?.message || "Unable to load villages."))
      .finally(() => !cancelled && patchLoading({ villages: false }));
    return () => {
      cancelled = true;
    };
  }, [value.districtId, value.blockId]);

  const setDistrict = (districtId: string) =>
    setValue((prev) => (prev.districtId === districtId ? prev : { districtId, blockId: "", villageId: "" }));
  const setBlock = (blockId: string) =>
    setValue((prev) => (prev.blockId === blockId ? prev : { ...prev, blockId, villageId: "" }));
  const setVillage = (villageId: string) => setValue((prev) => ({ ...prev, villageId }));

  /** Reset to a saved location (edit profile, once the profile has loaded). */
  const reset = useCallback((next: Partial<LocationValue>) => {
    setValue({ districtId: next.districtId || "", blockId: next.blockId || "", villageId: next.villageId || "" });
  }, []);

  return {
    value,
    districts,
    blocks,
    villages,
    loading,
    error,
    retry: loadDistricts,
    setDistrict,
    setBlock,
    setVillage,
    reset,
  };
}

export type LocationState = ReturnType<typeof useLocation>;

type PickerKind = "district" | "block" | "village";

export function LocationFields({ location, districtError }: { location: LocationState; districtError?: string }) {
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [search, setSearch] = useState("");

  const nameOf = (items: Option[], id: string) => items.find((item) => item.id === id)?.name;

  const source: Record<PickerKind, Option[]> = {
    district: location.districts,
    block: location.blocks,
    village: location.villages,
  };
  const options = useMemo(() => {
    if (!picker) return [];
    const q = search.trim().toLowerCase();
    const all = source[picker];
    return q ? all.filter((option) => option.name.toLowerCase().includes(q)) : all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker, search, location.districts, location.blocks, location.villages]);

  const open = (kind: PickerKind) => {
    setSearch("");
    setPicker(kind);
  };

  const select = (id: string) => {
    if (picker === "district") location.setDistrict(id);
    if (picker === "block") location.setBlock(id);
    if (picker === "village") location.setVillage(id);
    setPicker(null);
  };

  const { value, loading } = location;

  return (
    <View>
      <SelectField
        label="District"
        required
        icon="map-outline"
        placeholder="Select your district"
        value={nameOf(location.districts, value.districtId)}
        loading={loading.districts}
        onPress={() => open("district")}
        error={districtError}
      />
      <SelectField
        label="Block"
        icon="grid-outline"
        placeholder={value.districtId ? "Select your block" : "Choose a district first"}
        value={nameOf(location.blocks, value.blockId)}
        loading={loading.blocks}
        disabled={!value.districtId}
        onPress={() => open("block")}
      />
      <SelectField
        label="Village"
        icon="home-outline"
        placeholder={value.blockId ? "Select your village" : "Choose a block first"}
        value={nameOf(location.villages, value.villageId)}
        loading={loading.villages}
        disabled={!value.blockId}
        onPress={() => open("village")}
      />

      <OptionSheet
        visible={picker !== null}
        title={picker === "district" ? "Select district" : picker === "block" ? "Select block" : "Select village"}
        options={options}
        selectedId={picker ? value[`${picker}Id` as keyof LocationValue] : undefined}
        onSelect={select}
        onClose={() => setPicker(null)}
        searchValue={search}
        onSearch={picker && source[picker].length > 8 ? setSearch : undefined}
        emptyText={search ? "No matches." : "Nothing has been added here yet. Ask your coordinator."}
      />
    </View>
  );
}
