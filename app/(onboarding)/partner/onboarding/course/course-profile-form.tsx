'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { saveCourseProfile } from '@/actions/partner/save-course'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface InitialValues {
  name: string
  courseType: string
  holes: string
  par: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  website: string
  description: string
}

export function CourseProfileForm({
  courseId,
  initialValues,
}: {
  courseId?: string
  initialValues?: InitialValues
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [courseType, setCourseType] = useState(initialValues?.courseType ?? '')
  const [holes, setHoles] = useState(initialValues?.holes ?? '18')
  const [par, setPar] = useState(initialValues?.par ?? '72')
  const [address, setAddress] = useState(initialValues?.address ?? '')
  const [city, setCity] = useState(initialValues?.city ?? '')
  const [state, setState] = useState(initialValues?.state ?? '')
  const [zip, setZip] = useState(initialValues?.zip ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [website, setWebsite] = useState(initialValues?.website ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  const nameRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Load Google Places autocomplete
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || typeof window === 'undefined') return

    function initAutocomplete() {
      if (!nameRef.current || !window.google?.maps?.places) return
      const ac = new window.google.maps.places.Autocomplete(nameRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'us' },
      })
      autocompleteRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place?.address_components) return
        setName(place.name ?? '')

        let streetNumber = '', route = '', city_ = '', state_ = '', zip_ = ''
        for (const comp of place.address_components) {
          const t = comp.types
          if (t.includes('street_number')) streetNumber = comp.long_name
          if (t.includes('route')) route = comp.long_name
          if (t.includes('locality')) city_ = comp.long_name
          if (t.includes('administrative_area_level_1')) state_ = comp.short_name
          if (t.includes('postal_code')) zip_ = comp.long_name
        }
        if (streetNumber || route) setAddress(`${streetNumber} ${route}`.trim())
        if (city_) setCity(city_)
        if (state_) setState(state_)
        if (zip_) setZip(zip_)
        if (place.formatted_phone_number) setPhone(place.formatted_phone_number)
        if (place.website) setWebsite(place.website)
      })
    }

    if (window.google?.maps?.places) {
      initAutocomplete()
    } else {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    }
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Course name is required'
    if (!courseType) e.courseType = 'Course type is required'
    if (!address.trim()) e.address = 'Address is required'
    if (!city.trim()) e.city = 'City is required'
    if (!state) e.state = 'State is required'
    if (!zip.trim() || zip.length < 5) e.zip = 'Valid ZIP required'
    if (!description.trim()) e.description = 'Description is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setServerError('')
    const fd = new FormData()
    if (courseId) fd.append('courseId', courseId)
    fd.append('name', name)
    fd.append('courseType', courseType)
    fd.append('holes', holes)
    fd.append('par', par)
    fd.append('address', address)
    fd.append('city', city)
    fd.append('state', state)
    fd.append('zip', zip)
    fd.append('phone', phone)
    fd.append('website', website)
    fd.append('description', description)
    startTransition(async () => {
      const result = await saveCourseProfile(null, fd)
      if (result && 'error' in result) setServerError(result.error ?? '')
    })
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    background: '#1E1D1B',
    border: `1px solid ${hasError ? 'rgba(200,60,60,0.6)' : 'rgba(229,221,211,0.15)'}`,
    borderRadius: 2,
    color: '#F4EEE3',
    fontSize: 15,
    padding: '11px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  })

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#847C72', marginBottom: 6, display: 'block',
  }
  const errStyle: React.CSSProperties = { fontSize: 12, color: '#BF7B2E', marginTop: 4 }
  const field = (children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {serverError && (
        <div style={{
          background: 'rgba(191,123,46,0.1)', border: '1px solid rgba(191,123,46,0.3)',
          borderRadius: 2, padding: '12px 16px', fontSize: 13, color: '#BF7B2E',
        }}>
          {serverError}
        </div>
      )}

      {/* Row 1: Name + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field(<>
          <label style={lbl}>Course Name *</label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Torresdale Golf Course"
            style={inputStyle(!!fieldErrors.name)}
          />
          {fieldErrors.name && <span style={errStyle}>{fieldErrors.name}</span>}
        </>)}
        {field(<>
          <label style={lbl}>Course Type *</label>
          <select
            value={courseType}
            onChange={e => setCourseType(e.target.value)}
            style={{ ...inputStyle(!!fieldErrors.courseType), cursor: 'pointer' }}
          >
            <option value="">Select type…</option>
            <option value="Municipal">Municipal</option>
            <option value="Semi-Private">Semi-Private</option>
            <option value="Private">Private</option>
            <option value="Resort">Resort</option>
          </select>
          {fieldErrors.courseType && <span style={errStyle}>{fieldErrors.courseType}</span>}
        </>)}
      </div>

      {/* Row 2: Holes + Par */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field(<>
          <label style={lbl}>Number of Holes *</label>
          <select value={holes} onChange={e => setHoles(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
            <option value="9">9</option>
            <option value="18">18</option>
            <option value="27">27</option>
            <option value="36">36</option>
          </select>
        </>)}
        {field(<>
          <label style={lbl}>Par *</label>
          <input
            type="number"
            min={27}
            max={72}
            value={par}
            onChange={e => setPar(e.target.value)}
            style={inputStyle()}
          />
        </>)}
      </div>

      {/* Address */}
      {field(<>
        <label style={lbl}>Street Address *</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="8001 Torresdale Ave"
          style={inputStyle(!!fieldErrors.address)}
        />
        {fieldErrors.address && <span style={errStyle}>{fieldErrors.address}</span>}
      </>)}

      {/* City / State / ZIP */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        {field(<>
          <label style={lbl}>City *</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Philadelphia"
            style={inputStyle(!!fieldErrors.city)}
          />
          {fieldErrors.city && <span style={errStyle}>{fieldErrors.city}</span>}
        </>)}
        {field(<>
          <label style={lbl}>State *</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            style={{ ...inputStyle(!!fieldErrors.state), cursor: 'pointer' }}
          >
            <option value="">—</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {fieldErrors.state && <span style={errStyle}>{fieldErrors.state}</span>}
        </>)}
        {field(<>
          <label style={lbl}>ZIP *</label>
          <input
            type="text"
            value={zip}
            onChange={e => setZip(e.target.value)}
            placeholder="19136"
            style={inputStyle(!!fieldErrors.zip)}
          />
          {fieldErrors.zip && <span style={errStyle}>{fieldErrors.zip}</span>}
        </>)}
      </div>

      {/* Phone + Website */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field(<>
          <label style={lbl}>Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(215) 685-0787"
            style={inputStyle()}
          />
        </>)}
        {field(<>
          <label style={lbl}>Website <span style={{ color: '#5A5550', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="torresdalegc.com"
            style={inputStyle()}
          />
        </>)}
      </div>

      {/* Description */}
      {field(<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Course Description *</label>
          <span style={{ fontSize: 11, color: description.length > 260 ? '#BF7B2E' : '#847C72' }}>
            {description.length}/280
          </span>
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, 280))}
          placeholder="Describe your course in 2–3 sentences. What makes it worth visiting?"
          rows={4}
          style={{
            ...inputStyle(!!fieldErrors.description),
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />
        {fieldErrors.description && <span style={errStyle}>{fieldErrors.description}</span>}
      </>)}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 8 }}>
        <a
          href="/partner/apply"
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '13px 20px', border: '1px solid rgba(229,221,211,0.2)', borderRadius: 2,
            color: '#847C72', textDecoration: 'none',
          }}
        >
          ← Back
        </a>
        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? '#A8621E' : '#BF7B2E',
            color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '14px 28px', border: 'none', borderRadius: 2,
            cursor: pending ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {pending ? 'Saving…' : 'Save & Continue →'}
        </button>
      </div>
    </form>
  )
}
