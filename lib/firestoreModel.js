import { requireFirestore } from "./firebaseAdmin.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((entry) => entry !== undefined);
  }
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      const stripped = stripUndefined(val);
      if (stripped !== undefined) out[key] = stripped;
    }
    return out;
  }
  if (value === undefined) return undefined;
  return value;
}

function fromFirestoreValue(value) {
  if (Array.isArray(value)) return value.map(fromFirestoreValue);
  if (value && typeof value === "object") {
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = fromFirestoreValue(val);
    }
    return out;
  }
  return value;
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCompare(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.getTime();
  if (Array.isArray(value)) return value.map(normalizeCompare);
  if (typeof value === "object") return String(value);
  return value;
}

function valuesEqual(left, right) {
  const a = normalizeCompare(left);
  const b = normalizeCompare(right);

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => valuesEqual(item, b[idx]));
  }

  return String(a) === String(b);
}

function matchesCondition(docValue, condition) {
  if (isPlainObject(condition)) {
    if (Object.prototype.hasOwnProperty.call(condition, "$in")) {
      return Array.isArray(condition.$in) && condition.$in.some((candidate) => valuesEqual(docValue, candidate));
    }
    if (Object.prototype.hasOwnProperty.call(condition, "$nin")) {
      return Array.isArray(condition.$nin) && !condition.$nin.some((candidate) => valuesEqual(docValue, candidate));
    }
    if (Object.prototype.hasOwnProperty.call(condition, "$ne")) {
      return !valuesEqual(docValue, condition.$ne);
    }
    if (Object.prototype.hasOwnProperty.call(condition, "$regex")) {
      const pattern = String(condition.$regex || "");
      const flags = String(condition.$options || "");
      const regex = new RegExp(pattern, flags);
      return regex.test(String(docValue || ""));
    }
  }

  if (Array.isArray(docValue)) {
    return docValue.some((entry) => valuesEqual(entry, condition));
  }

  return valuesEqual(docValue, condition);
}

export function matchesFilter(doc, filter = {}) {
  if (!filter || !isPlainObject(filter)) return true;

  if (Array.isArray(filter.$or)) {
    return filter.$or.some((subFilter) => matchesFilter(doc, subFilter));
  }

  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$or") return true;
    return matchesCondition(doc?.[key], condition);
  });
}

export function sortDocs(docs, spec = {}) {
  const entries = Object.entries(spec || {});
  if (!entries.length) return docs;
  const [field, orderRaw] = entries[0];
  const order = Number(orderRaw) < 0 ? -1 : 1;

  return [...docs].sort((a, b) => {
    const av = normalizeCompare(a?.[field]);
    const bv = normalizeCompare(b?.[field]);
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return av > bv ? order : -order;
  });
}

export function createFirestoreModel(collectionName, { defaults = {}, timestamps = true } = {}) {
  return class FirestoreModel {
    static collectionName = collectionName;
    static defaults = defaults;
    static timestamps = timestamps;

    constructor(payload = {}) {
      Object.assign(this, clonePlain(defaults), payload);
    }

    get id() {
      return this._id;
    }

    toObject() {
      return clonePlain({ ...this });
    }

    static async _allRaw() {
      const db = requireFirestore();
      const snapshot = await db.collection(collectionName).get();
      return snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...fromFirestoreValue(doc.data() || {}),
      }));
    }

    static async _rawById(id) {
      if (!id) return null;
      const db = requireFirestore();
      const snap = await db.collection(collectionName).doc(String(id)).get();
      if (!snap.exists) return null;
      return { _id: snap.id, ...fromFirestoreValue(snap.data() || {}) };
    }

    static async find(filter = {}) {
      const docs = await this._allRaw();
      return docs.filter((entry) => matchesFilter(entry, filter)).map((entry) => new this(entry));
    }

    static async findOne(filter = {}) {
      const docs = await this.find(filter);
      return docs[0] || null;
    }

    static async findById(id) {
      const raw = await this._rawById(id);
      return raw ? new this(raw) : null;
    }

    static async updateOne(filter = {}, patch = {}) {
      const found = await this.findOne(filter);
      if (!found) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(found, patch);
      await found.save();
      return { matchedCount: 1, modifiedCount: 1 };
    }

    static async deleteOne(filter = {}) {
      const found = await this.findOne(filter);
      if (!found?._id) return { deletedCount: 0 };
      const db = requireFirestore();
      await db.collection(collectionName).doc(String(found._id)).delete();
      return { deletedCount: 1 };
    }

    static async create(payload = {}) {
      const instance = new this(payload);
      await instance.save();
      return instance;
    }

    async save() {
      const db = requireFirestore();
      const now = new Date();
      if (this.constructor.timestamps) {
        if (!this.createdAt) this.createdAt = now;
        this.updatedAt = now;
      }

      const payload = stripUndefined({ ...this });
      delete payload._id;
      delete payload.id;

      if (this._id) {
        await db.collection(collectionName).doc(String(this._id)).set(payload, { merge: true });
      } else {
        const ref = db.collection(collectionName).doc();
        this._id = ref.id;
        await ref.set(payload);
      }
      return this;
    }

    async deleteOne() {
      if (!this._id) return { deletedCount: 0 };
      const db = requireFirestore();
      await db.collection(collectionName).doc(String(this._id)).delete();
      return { deletedCount: 1 };
    }
  };
}

